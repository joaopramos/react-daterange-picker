'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getYearMonth = getYearMonth;
function getYearMonth(date) {
  if (!date) {
    return undefined;
  }

  return { year: date.year(), month: date.month() };
}

var getYearMonthProps = exports.getYearMonthProps = function getYearMonthProps(props) {
  var end = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var selectionType = props.selectionType,
      value = props.value;

  if (!value) {
    return undefined;
  }

  if (selectionType === 'single') {
    return getYearMonth(value);
  }

  if (end) {
    return getYearMonth(props.value.end);
  }

  return getYearMonth(props.value.start);
};