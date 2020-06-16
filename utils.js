const { Random } = require("mockjs-lite");
const moment = require('moment')
function getTimestamps({
  start,
  end,
  step = 60000,
  limit = 500
}) {
  const ret = [];
  let curr = start;
  while (curr <= end && ret.length < limit) {
    curr = curr + step;
    ret.push(curr);
  }
  return ret.map(d => d / 1000);
};

exports.getTimestamps = getTimestamps;

exports.getPeriodTimestamps = function({ startTime, endTime, period = 60 }){
  return getTimestamps({
    start: moment(startTime).valueOf(),
    end: moment(endTime).valueOf(),
    step: period * 1000
  })
}

exports.array = function getRandomArray(length, min = 30, max) {
  if (Array.isArray(length)) {
    const params = length;
    return params.reduce((acc, curr) => {
      return acc.concat(getRandomArray(...curr));
    }, []);
  }
  if (max == null) {
    return Array(length).fill(min);
  }
  return Array.from({ length: length }, () =>
    Math.floor(Math.random() * (max - min) + min)
  );
};

exports.timeCosts = [1, 1, 5, 2, 2, 2, 10, 0.5, 6, 30, 25, 11, 18];

exports.timestamps = getTimestamps({
  start: 1559797200000,
  end: 1562083199999
});
