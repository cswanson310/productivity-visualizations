const moment = require('moment');

export default function OneStat(props) {
  const readyClass = props.ready ? "ready" : "loading";
  let userPercent = 0;
  let totalPercent = 0;
  let value = props.value;
  let total = props.total;
  let units = props.units;
  if (total && typeof total === "number") {
    const larger = Math.max(value, total);
    const maxWidth = 80;
    userPercent = (value / larger) * maxWidth;
    totalPercent = (total / larger) * maxWidth;
  }

  if (units === "millis") {
    units = null;
    function humanize(millis) {
      const d = moment.duration(millis, "milliseconds");
      return `${d.days()}d ${(d.hours() + (d.minutes() / 60)).toFixed(1)}h`
    }
    value = humanize(value);
    if (total) {
      total = humanize(total);
    }
  }

  if (typeof value === "number") {
    value = value.toFixed(1);
    if (total) {
      total = total.toFixed(1);
    }
  }
  return (
    <td className='stat-block'>
      <h3>{props.name}</h3>
      <p><span className={readyClass}>{value}</span>{total ? ` / ${total}` : ""} {units}</p>
      <div id="user-bar" className={readyClass + " viz-bar"} ></div>
      <div id="total-bar" className="viz-bar"></div>
      <style jsx>{`
        .loading {
          color: #ccc;
        }
        h3 {
          font: 15px sans-serif;
          margin: 10px 0;
          color: #4a4f52;
          padding: 0;
        }
        .stat-block {
          width: 180px;
          color: #4a4f52;
          padding: 0;
        }
        p {
          font-size: 14px;
          margin: 0;
          padding: 0;
        }
        .ready {
          color: #16CC62;
          font-weight: bold;
        }
        .viz-bar {
          height: 5px;
          background: rgba(211, 211, 211, 50);
          margin: 2px 0px;
          border-radius: 5px;
        }
        #user-bar {
          width: ${userPercent}%;
        }
        #user-bar.ready {
          background: #16CC62;
        }
        #total-bar {
          width: ${totalPercent}%;
        }
      `}</style>
    </td>
  );
}

