import React from 'react';

function Other(props) {
  return (
    <div>
      <p>{props.name}</p>
    </div>
  );
}

export default function NameSamples(props) {
  return (
    <div>
      <ul>
        {props.names.map((name, idx) => <li key={idx} >{name}</li>)}
      </ul>
    <style jsx>{`
      div {
        display: inline-block;
      }
      ul {
        padding: 0;
        margin: 0;
      }
      li {
        list-style-type: none;
        display: inline-block;
        font: 12px sans-serif;
        padding: 3px 6px;
        margin: 4px;
        vertical-align: middle;
        border-radius: 2px;
        background: rgba(211, 211, 211, 50);
        color: #777;
      }
    `}</style>
    </div>
  );
}
