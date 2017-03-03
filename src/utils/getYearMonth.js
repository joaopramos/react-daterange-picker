export function getYearMonth(date) {
  if (!date) {
    return undefined;
  }

  return { year: date.year(), month: date.month() };
}

export const getYearMonthProps = function (props, end = false) {
  const { selectionType, value } = props;
  if (!value) {
    return undefined;
  }

  if (selectionType === 'single') {
    return getYearMonth(value);
  }

  if(end) {
    return getYearMonth(props.value.end)
  }

  return getYearMonth(props.value.start);
};
