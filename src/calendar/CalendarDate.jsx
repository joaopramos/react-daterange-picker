import React from 'react';
import ReactDOM from 'react-dom';

import Immutable from 'immutable';

import BemMixin from '../utils/BemMixin';
import CustomPropTypes from '../utils/CustomPropTypes';
import PureRenderMixin from '../utils/PureRenderMixin';
import lightenDarkenColor from '../utils/lightenDarkenColor';

import CalendarDatePeriod from './CalendarDatePeriod';
import CalendarHighlight from './CalendarHighlight';
import CalendarSelection from './CalendarSelection';


const CalendarDate = React.createClass({
  mixins: [BemMixin, PureRenderMixin],

  propTypes: {
    date: CustomPropTypes.moment,

    firstOfMonth: React.PropTypes.object.isRequired,

    isSelectedDate: React.PropTypes.bool,
    isSelectedRangeStart: React.PropTypes.bool,
    isSelectedRangeEnd: React.PropTypes.bool,
    isInSelectedRange: React.PropTypes.bool,

    isHighlightedDate: React.PropTypes.bool,
    isHighlightedRangeStart: React.PropTypes.bool,
    isHighlightedRangeEnd: React.PropTypes.bool,
    isInHighlightedRange: React.PropTypes.bool,

    highlightedDate: React.PropTypes.object,
    dateStates: React.PropTypes.instanceOf(Immutable.List),
    isDisabled: React.PropTypes.bool,
    isToday: React.PropTypes.bool,

    dateRangesForDate: React.PropTypes.func,
    onHighlightDate: React.PropTypes.func,
    onUnHighlightDate: React.PropTypes.func,
    onSelectDate: React.PropTypes.func,
    onInteractionStart: React.PropTypes.func,
  },

  getInitialState() {
    return {
      mouseDown: false,
      lastHighlight: null //used for touchend
    };
  },

  componentDidMount() {
    ReactDOM.findDOMNode(this).addEventListener('customtouchenter', this.touchEnter);
  },
  componentWillUnmount() {
    this.isUnmounted = true;
    document.removeEventListener('mouseup', this.mouseUp);
    document.removeEventListener('touchend', this.touchEnd);
    document.removeEventListener('touchmove', this.touchMove);
    ReactDOM.findDOMNode(this).removeEventListener('customtouchenter', this.touchEnter);
    document.removeEventListener('mousenter', this.mouseEnter);
  },

  mouseUp() {
    this.props.onSelectDate(this.props.date);

    if (this.isUnmounted) {
      return;
    }

    if (this.state.mouseDown) {
      this.setState({
        mouseDown: false,
        lastHighlight: null //used for touchend
      });
    }

    document.removeEventListener('mouseup', this.mouseUp);
  },

  mouseDown() {
    this.props.onInteractionStart(this.props.date);

    this.setState({
      mouseDown: true,
    });

    document.addEventListener('mouseup', this.mouseUp);
  },

  touchEnd() {
    this.props.onSelectDate(this.state.lastHighlight || this.props.date);

    if (this.isUnmounted) {
      return;
    }

    if (this.state.mouseDown) {
      this.setState({
        mouseDown: false,
        lastHighlight: null //used for touchend
      });
    }
    document.removeEventListener('touchend', this.touchEnd);
    document.removeEventListener('touchmove', this.touchMove);
  },

  touchStart(event) {
    this.props.onHighlightDate(this.props.date);
    this.props.onInteractionStart(this.props.date);

    event.preventDefault();
    this.setState({
      mouseDown: true,
    });
    document.addEventListener('touchmove', this.touchMove);
    document.addEventListener('touchend', this.touchEnd);
  },

  touchMove(event) {
    let target = document.elementFromPoint(event.targetTouches[0].clientX, event.targetTouches[0].clientY);

    if(target && target !== this.state.lastTouchEl) {
      this.setState({
        lastTouchEl: target
      });

      target.dispatchEvent(
        new CustomEvent('customtouchenter', {
            detail: {
                update: this.updateLastHighlight
            },
            bubbles: true
        })
      );
    }
  },

  touchEnter(event) {
    event.stopPropagation();
    this.props.onHighlightDate(this.props.date);
    event.detail.update(this.props.date); // return to the element responsible for touchEnd
  },

  mouseEnter() {
    this.props.onHighlightDate(this.props.date);
  },

  mouseLeave() {
    if (this.state.mouseDown) {
      this.props.onSelectDate(this.props.date);

      this.setState({
        mouseDown: false,
      });
    }
    this.props.onUnHighlightDate(this.props.date);
  },

  updateLastHighlight(date) {
    this.setState({
      lastHighlight: date
    });
  },

  getBemModifiers() {
    let {date, firstOfMonth, isToday: today} = this.props;

    let otherMonth = false;
    let weekend = false;

    if (date.month() !== firstOfMonth.month()) {
      otherMonth = true;
    }

    if (date.day() === 0 || date.day() === 6) {
      weekend = true;
    }

    return {today, weekend, otherMonth};
  },

  getBemStates() {
    let {
      isSelectedDate,
      isInSelectedRange,
      isInHighlightedRange,
      isHighlightedDate: highlighted,
      isDisabled: disabled,
    } = this.props;

    let selected = isSelectedDate || isInSelectedRange || isInHighlightedRange;

    return {disabled, highlighted, selected};
  },

  render() {
    let {
      date,
      dateRangesForDate,
      isSelectedDate,
      isSelectedRangeStart,
      isSelectedRangeEnd,
      isInSelectedRange,
      isHighlightedDate,
      isHighlightedRangeStart,
      isHighlightedRangeEnd,
      isInHighlightedRange,
    } = this.props;

    let bemModifiers = this.getBemModifiers();
    let bemStates = this.getBemStates();
    let pending = isInHighlightedRange;

    let color;
    let amColor;
    let pmColor;
    let states = dateRangesForDate(date);
    let numStates = states.count();
    let cellStyle = {};
    let style = {};

    let highlightModifier;
    let selectionModifier;

    if (isSelectedDate || (isSelectedRangeStart && isSelectedRangeEnd)
        || (isHighlightedRangeStart && isHighlightedRangeEnd)) {
      selectionModifier = 'single';
    } else if (isSelectedRangeStart || isHighlightedRangeStart) {
      selectionModifier = 'start';
    } else if (isSelectedRangeEnd || isHighlightedRangeEnd) {
      selectionModifier = 'end';
    } else if (isInSelectedRange || isInHighlightedRange) {
      selectionModifier = 'segment';
    }

    if (isHighlightedDate) {
      highlightModifier = 'single';
    }

    if (numStates === 1) {
      // If there's only one state, it means we're not at a boundary
      color = states.getIn([0, 'color']);

      if (color) {

        style = {
          backgroundColor: color,
        };
        cellStyle = {
          borderLeftColor: lightenDarkenColor(color, -10),
          borderRightColor: lightenDarkenColor(color, -10),
        };
      }
    } else {
      amColor = states.getIn([0, 'color']);
      pmColor = states.getIn([1, 'color']);

      if (amColor) {
        cellStyle.borderLeftColor = lightenDarkenColor(amColor, -10);
      }

      if (pmColor) {
        cellStyle.borderRightColor = lightenDarkenColor(pmColor, -10);
      }
    }

    return (
      <td className={this.cx({element: 'Date', modifiers: bemModifiers, states: bemStates})}
        style={cellStyle}
        onTouchStart={this.touchStart}
        onMouseEnter={this.mouseEnter}
        onMouseLeave={this.mouseLeave}
        onMouseDown={this.mouseDown}>
        {numStates > 1 &&
          <div className={this.cx({element: "HalfDateStates"})}>
            <CalendarDatePeriod period="am" color={amColor} />
            <CalendarDatePeriod period="pm" color={pmColor} />
          </div>}
        {numStates === 1 &&
          <div className={this.cx({element: "FullDateStates"})} style={style} />}
        <span className={this.cx({element: "DateLabel"})}>{date.format('D')}</span>
        {selectionModifier ? <CalendarSelection modifier={selectionModifier} pending={pending} /> : null}
        {highlightModifier ? <CalendarHighlight modifier={highlightModifier} /> : null}
      </td>
    );
  },
});

export default CalendarDate;
