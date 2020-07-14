import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'dva/router';
import { Card, Button, Checkbox, Input, Alert, Select, message } from 'antd';
import { isFPESenType } from '../../../utils/SenFieldType';
import gridstyle from './index.less';

export default class Wrapper extends Component {
  static propTypes = {
    taskId: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
    algos: PropTypes.array.isRequired,
    nextLoading: PropTypes.bool.isRequired,
    onSave: PropTypes.func.isRequired,
    preStep: PropTypes.func.isRequired,
  };

  static defaultProps = {
    taskId: '',
    taskData: '',
    algos: [],
    nextLoading: false,
    onSave() {},
    preStep() {},
  };

  constructor(props) {
    super(props);
    this.state = {
      addWater: false,
      waterMessage: '',
      keyCol: 0,
      gridData: null,
    };
    this.step = 2;
  }

  componentWillMount() {
    const { taskData } = this.props;
    let densenJson;
    try {
      densenJson = taskData.densenJson == '' ? null : JSON.parse(taskData.densenJson);
    } catch (e) {
      return <Alert message="错误" description="数据解析错误" type="warning" />;
    }

    if (densenJson && densenJson.if_water == 1) {
      this.setState({
        addWater: true,
        keyCol: densenJson.key_col,
        waterMessage: taskData.waterMessage,
      });
    }
  }

  render() {
    const { taskId, taskData, algos, nextLoading } = this.props;

    // if (taskData === null) {
    //   return <Alert message="错误" description="配置不存在" type="warning" />;
    // }

    if (!taskData || taskData.searchResult === '') {
      return <Alert message="请稍等片刻" description="正在加载数据..." type="info" />;
    }

    let searchJson, searchResult, densenJson;

    try {
      searchJson = JSON.parse(taskData.searchJson);
      searchResult = JSON.parse(taskData.searchResult);
      densenJson = taskData.densenJson == '' ? null : JSON.parse(taskData.densenJson);
    } catch (e) {
      return <Alert message="错误" description="数据解析错误" type="warning" />;
    }

    const { table_head, sen_type, sample_data } = searchResult;

    const data = [];

    const fieldTypes = searchJson.fieldTypes;

    const dsFieldTypes = densenJson ? densenJson.sen_algo : [];

    if (null == densenJson) {
      for (let i = 0, ii = table_head.length; i < ii; i++) {
        data.push({
          fieldName: table_head[i],
          fieldType: sen_type[i],
          value: sample_data[i],
          algos,
        });
      }
    } else {
      for (let i = 0, ii = table_head.length; i < ii; i++) {
        data.push({
          fieldName: table_head[i],
          fieldType: densenJson.sen_algo[i]['type'],
          value: sample_data[i],
          algos,
        });
      }
    }

    return (
      <Card bordered={false}>
        <div style={{ marginBottom: 16 }}>
          <MyGrid
            data={data}
            fieldTypes={fieldTypes}
            dsFieldTypes={dsFieldTypes}
            onChange={this.handleGridChange}
          />
        </div>
        {this.renderWaterOption()}
        {this.renderWaterMessage(data, densenJson)}
        <div style={{ textAlign: 'center' }}>
          <Button type="primary" style={{ marginRight: 32 }} onClick={this.handlePre}>
            上一步
          </Button>
          <Button
            type="primary"
            onClick={this.handleNext}
            style={{ marginRight: 32 }}
            loading={nextLoading}
          >
            下一步
          </Button>
          <Link to="/useradmin/rule/list">取消返回</Link>
        </div>
      </Card>
    );
  }

  renderWaterOption() {
    if (window.g_config.system.versionName == 'cdsmask') {
      return null;
    }
    return (
      <div style={{ marginBottom: 16 }}>
        <Checkbox onChange={this.handleAddWater} checked={this.state.addWater}>
          添加水印
        </Checkbox>
      </div>
    );
  }

  handleAddWater = e => {
    this.setState({
      addWater: e.target.checked,
    });
  };

  renderWaterMessage(tableData, densenJson) {
    if (!this.state.addWater) return null;
    const Option = Select.Option;
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <Alert message="水印列脱敏算法只支持令牌化" type="info" />
        </div>
        <div style={{ marginBottom: 8 }}>
          <Input
            value={this.state.waterMessage}
            onChange={this.handleWaterMessage}
            addonBefore="水印信息"
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <span>第几列：</span>
          <Select onChange={this.handleKeyCol} value={this.state.keyCol} style={{ width: 80 }}>
            {tableData.map((d, k) => <Option value={k}>{k + 1}</Option>)}
          </Select>
        </div>
      </div>
    );
  }

  handleWaterMessage = e => {
    this.setState({
      waterMessage: e.target.value,
    });
  };

  handleKeyCol = value => {
    // console.log('keyCol selected: ', value);
    this.setState({
      keyCol: value,
    });
  };

  handleGridChange = value => {
    // console.log(value);
    this.setState({
      gridData: value,
    });
  };

  findUserAlgo(id) {
    const { algos } = this.props;
    const user_alg = algos.find(r => r.id == id);
    return { ort: user_alg.algoRule, replace: user_alg.algoReplace };
  }

  handlePre = () => {
    const { preStep } = this.props;
    preStep(this.step - 1);
  };

  handleNext = () => {
    // console.log(this.state);
    const { taskData, algos, onSave } = this.props;
    const { addWater, waterMessage, gridData, keyCol } = this.state;

    const {
      fieldTypesSelected,
      isPrimaryKeys,
      primaryKeyAlgoSelected,
      unprimaryKeyAlgoSelected,
      allData,
    } = gridData;

    const sen_algo = [];
    const user_alog = {};

    if (addWater) {
      const waterAlgo =
        isPrimaryKeys[keyCol] == 1
          ? primaryKeyAlgoSelected[keyCol]
          : unprimaryKeyAlgoSelected[keyCol];
      if ('densen_token' != waterAlgo) {
        message.error('第' + (keyCol + 1) + '列脱敏算法不是令牌化，不支持水印，请选择其它列。');
        return false;
      }
    }

    for (let i = 0, ii = fieldTypesSelected.length; i < ii; i++) {
      const algo = isPrimaryKeys[i] == 1 ? primaryKeyAlgoSelected[i] : unprimaryKeyAlgoSelected[i];
      sen_algo.push({
        type: fieldTypesSelected[i],
        name: allData[i]['fieldName'],
        // algo: isNaN(algo) ? algo : 'densen_self',
        algo,
        if_k: algo == 'if_k' ? 1 : 0,
        is_pk: isPrimaryKeys[i],
      });
      if (!isNaN(algo)) {
        user_alog[algo] = this.findUserAlgo(algo);
      }
    }

    const json = {
      if_sample: addWater ? 0 : 1,
      if_water: addWater ? 1 : 0,
      key_col: Number(keyCol),
      water_type: 'token',
      k: 5,
      salt: taskData.saltMessage,
      user_alg: user_alog,
      sen_algo,
    };
    const data = {
      step: 2,
      taskId: taskData.id,
      waterMessage: waterMessage,
      data: JSON.stringify(json),
    };
    onSave(data);
  };
}

function colSplit(e) {
  const target = e.target;

  if (
    !target.hasAttribute('data-role') ||
    target.getAttribute('data-role') != 'mygrid-td-spliter'
  ) {
    return true;
  }

  const startX = e.clientX;
  const parentNode = target.parentNode.parentNode;
  const width = parseInt(
    document.defaultView.getComputedStyle(parentNode).getPropertyValue('width')
  );

  document.addEventListener('mousemove', _move);

  document.addEventListener('mouseup', function() {
    document.removeEventListener('mousemove', _move);
  });

  function _move(e) {
    const endX = e.clientX;
    const deltaX = endX - startX;
    const newWidth = width + deltaX + 'px';
    parentNode.style['max-width'] = newWidth;
    parentNode.style['width'] = newWidth;
    parentNode.style['min-width'] = newWidth;
  }
}

class MyGrid extends Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    fieldTypes: PropTypes.array.isRequired,
    dsFieldTypes: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  static defaultProps = {
    data: [],
    fieldTypes: [],
    dsFieldTypes: [],
    onChange() {},
  };

  constructor(props) {
    super(props);
    const { data, fieldTypes, dsFieldTypes } = props;

    const isPrimaryKeys = [];
    const isForeignKeys = [];
    const fieldTypesSelected = [];
    const primaryKeyAlgoSelected = [];
    const unprimaryKeyAlgoSelected = [];

    if (dsFieldTypes.length != 0) {
      for (let i = 0, ii = data.length; i < ii; i++) {
        const type = data[i]['fieldType'];
        const fieldType = dsFieldTypes[i];
        isPrimaryKeys.push(fieldType ? fieldType.is_pk : 0);
        isForeignKeys.push(0);
        fieldTypesSelected.push(type);
        primaryKeyAlgoSelected.push(fieldType ? fieldType.algo : 'densen_token');
        unprimaryKeyAlgoSelected.push(fieldType ? fieldType.algo : 'densen_back');
      }
    } else {
      for (let i = 0, ii = data.length; i < ii; i++) {
        const type = data[i]['fieldType'];
        const fieldType = fieldTypes.find(f => f.type === type);
        isPrimaryKeys.push(0);
        isForeignKeys.push(0);
        fieldTypesSelected.push(type);
        primaryKeyAlgoSelected.push(fieldType ? fieldType.pfAlg : 'densen_token');
        unprimaryKeyAlgoSelected.push(fieldType ? fieldType.npfAlg : 'densen_back');
      }
    }

    this.state = {
      isPrimaryKeys,
      isForeignKeys,
      fieldTypesSelected,
      primaryKeyAlgoSelected,
      unprimaryKeyAlgoSelected,
      allData: data,
    };
  }

  componentDidMount() {
    const { onChange } = this.props;
    onChange(this.state);
    document.addEventListener('mousedown', colSplit);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', colSplit);
  }

  handleChange(name, key, value) {
    const { onChange } = this.props;
    const {
      isPrimaryKeys,
      isForeignKeys,
      fieldTypesSelected,
      primaryKeyAlgoSelected,
      unprimaryKeyAlgoSelected,
      allData,
    } = this.state;
    switch (name) {
      case 'isPrimaryKey':
        isPrimaryKeys[key] = value;
        break;
      case 'isForeignKey':
        isForeignKeys[key] = value;
        break;
      case 'fieldType':
        fieldTypesSelected[key] = value;
        break;
      case 'primaryKeyAlgo':
        primaryKeyAlgoSelected[key] = value;
        break;
      case 'unprimaryKeyAlgo':
        unprimaryKeyAlgoSelected[key] = value;
        break;
    }

    const newState = {
      isPrimaryKeys,
      isForeignKeys,
      fieldTypesSelected,
      primaryKeyAlgoSelected,
      unprimaryKeyAlgoSelected,
      allData,
    };

    onChange(newState);

    this.setState(newState);
  }

  render() {
    const { data, fieldTypes } = this.props;
    const { isPrimaryKeys } = this.state;
    return (
      <div className={gridstyle.mygrid}>
        <div className={gridstyle['mygrid-rownum']} style={{ width: 150 }}>
          <table>
            <tbody>
              <tr>
                <td className={gridstyle['mygrid-td']}>
                  <div className={gridstyle['mygrid-td-inner']}>列</div>
                </td>
              </tr>
              <tr>
                <td className={gridstyle['mygrid-td']}>
                  <div className={gridstyle['mygrid-td-inner']}>字段名</div>
                </td>
              </tr>
              <tr>
                <td className={gridstyle['mygrid-td']}>
                  <div className={gridstyle['mygrid-td-inner']}>抽样数据</div>
                </td>
              </tr>
              <tr>
                <td className={gridstyle['mygrid-td']}>
                  <div className={gridstyle['mygrid-td-inner']}>是否主(或外)键</div>
                </td>
              </tr>
              <tr>
                <td className={gridstyle['mygrid-td']}>
                  <div className={gridstyle['mygrid-td-inner']}>敏感字段类型</div>
                </td>
              </tr>
              <tr>
                <td className={gridstyle['mygrid-td']}>
                  <div className={gridstyle['mygrid-td-inner']}>脱敏算法</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={gridstyle['mygrid-body']} style={{ marginLeft: 150 }}>
          <table>
            <tbody>
              <tr>
                {data.map((d, k) => (
                  <td key={k} className={gridstyle['mygrid-body-td']}>
                    <div unselectable="on" className={gridstyle['mygrid-td-inner']}>
                      {k + 1}
                      <span
                        data-role="mygrid-td-spliter"
                        className={gridstyle['mygrid-td-spliter']}
                      />
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                {data.map((d, k) => (
                  <td key={k} className={gridstyle['mygrid-body-td']}>
                    <div unselectable="on" className={gridstyle['mygrid-td-inner']}>
                      {d.fieldName}
                      <span
                        data-role="mygrid-td-spliter"
                        className={gridstyle['mygrid-td-spliter']}
                      />
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                {data.map((d, k) => (
                  <td key={k} className={gridstyle['mygrid-body-td']}>
                    <div className={gridstyle['mygrid-td-inner']}>{d.value}</div>
                  </td>
                ))}
              </tr>
              <tr>
                {data.map((d, k) => (
                  <td key={k} className={gridstyle['mygrid-body-td']}>
                    <div className={gridstyle['mygrid-body-control']}>
                      <select
                        value={isPrimaryKeys[k]}
                        onChange={e => this.handleChange(`isPrimaryKey`, k, e.target.value)}
                        className={gridstyle['mygrid-body-select']}
                      >
                        <option value={0}>否</option>
                        <option value={1}>是</option>
                      </select>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                {data.map((d, k) => (
                  <td key={k} className={gridstyle['mygrid-body-td']}>
                    <div className={gridstyle['mygrid-body-control']}>
                      <select
                        onChange={e => this.handleChange(`fieldType`, k, e.target.value)}
                        value={this.state.fieldTypesSelected[k]}
                        className={gridstyle['mygrid-body-select']}
                      >
                        <option value="未知类型">请选择</option>
                        {fieldTypes.map((f, kk) => (
                          <option value={f.type} key={kk}>
                            {f.type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                {data.map((d, k) => (
                  <td key={k} className={gridstyle['mygrid-body-td']}>
                    <div className={gridstyle['mygrid-body-control']}>{this.renderAlgos(d, k)}</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  renderAlgos(d, k) {
    const {
      isPrimaryKeys,
      fieldTypesSelected,
      primaryKeyAlgoSelected,
      unprimaryKeyAlgoSelected,
    } = this.state;

    const isPrimaryKey = isPrimaryKeys[k];
    const fieldType = fieldTypesSelected[k];

    if (isPrimaryKey == 1) {
      return (
        <select
          value={primaryKeyAlgoSelected[k]}
          onChange={e => this.handleChange('primaryKeyAlgo', k, e.target.value)}
          className={gridstyle['mygrid-body-select']}
        >
          <option value="densen_token">令牌化</option>
          {isFPESenType(fieldType) && <option value="densen_FPE">格式保留</option>}
          <option value="densen_back">全保留</option>
        </select>
      );
    }

    return (
      <select
        value={unprimaryKeyAlgoSelected[k]}
        onChange={e => this.handleChange('unprimaryKeyAlgo', k, e.target.value)}
        className={gridstyle['mygrid-body-select']}
      >
        <option value="densen_token">令牌化</option>
        <option value="densen_shuffle">洗牌</option>
        <option value="densen_screen">屏蔽</option>
        <option value="densen_star">加星</option>
        <option value="densen_FPE">格式保留</option>
        <option value="densen_back">全保留</option>
        <option value="if_k">k匿名</option>
        <option value="densen_aes">AES加密</option>
        {d.algos.map((f, kk) => (
          <option value={f.id} key={kk}>
            {f.algoTitle}
          </option>
        ))}
      </select>
    );
  }
}
