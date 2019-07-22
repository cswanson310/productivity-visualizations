import React from 'react';

export function TimeOption(props) {
  return (
    <li>
      <label className="opt-label">
        <input type="radio" value={props.value} checked={props.isChecked} onChange={props.onChange} />
        <div className={props.isChecked ? "opt checked" : "opt"}>
          {props.children}
        </div>
      </label>
      <style jsx>{`
        li {
          display: inline-block;
          position: relative;
          list-style-type: none;
          margin: 0 0.2vw;
        }
        input {
          width: 100%;
          position: absolute;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          pointer-events: none;
        }
        .opt-label {
          margin: 0px 2px;
          display: table-row;
          width: 4.7vw;
          height: 100%;
        }
        .opt {
          height: 100%;
          display: flex;
          background-color: white;
          border: 1px solid #BABDBE;
          border-radius: 2px;
          box-shadow: 0 1px 1px rgba(0,0,0,0.15);
          cursor: pointer;
          padding: 4px;
        }
        .opt:hover {
          border: 2px solid #2D6F5A;
          font-weight: bold;
        }
        .opt.checked {
          border: 2px solid #16CC62;
        }
      `}</style>
    </li>
  );
}

export function TimeSelector(props) {
  return (
    <div>
      <ul>
        {React.Children.map(props.children, child => {
          if (child.type === TimeOption)
            return React.cloneElement(child, {
                        isChecked: props.value == child.props.value,
                        name: props.name,
                        onChange: props.onChange
                     });
          return child;
        })}
      </ul>
      <style jsx>{`
        ul {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
