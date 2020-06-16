/**
 * 获取菜单列表
 *
 * @url /list
 *
 * POST:
 */

const { timeCosts, timestamps, array } = require("../utils");

let Count = 20;
let rows = []
const typeArr = ['辣','不辣','微辣'];
while(Count--){
  let random = Math.random()*100
  let random1 = Math.random()*3
  
  rows.push({
    name: '苹果' + Count,
    price: Math.round(random),
    type: typeArr[random1]
  })
}

module.exports = {
  code: 0,
  data: {
    TotalCount: 5,
    'rows': rows
  }
};