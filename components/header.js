function Crumb(props) {
  return (
    <span className={`crumb ${props.first}`}>
      {props.text}
      <style jsx>{`
        span {
          color: #006cbc;
          font: 12px sans-serif;
          padding: 0 4px;
          font-family: Helvetica;
          font-weight: bold;
          text-transform: uppercase;
        }
        .crumb.first {
          padding-left: 0px;
        }
      `}</style>
    </span>
  );

}

export default function Header(props) {
  return (
    <div id="header">
      <div id="img-block">
        <img src="/static/mongodb-logo.png" alt="MongoDB"/>
      </div>
      <div id="crumbs">
        <Crumb text="TEAMS" first="first" />
        <span className="sep">
          >
        </span>
        {props.team && <Crumb text={props.team} />}
      </div>
      <style jsx>{`
        #header {
          background: #fafbfc;
        }
        #img-block {
          height: 60px;
          border-bottom: 1px solid #d8d8d8;
          background: #fff;
          margin: 0;
          padding: 0;
        }
        img {
          padding: 10px 40px;
          width: 120px;
        }
        .sep {
          font-family: Helvetica;
          font-weight: bold;
        }
        #crumbs {
          vertical-align: center;
          padding: 25px 7vw;
        }
        #crumbs:first-child {
          padding-left: 0px;
        }
        #crumbs span {
          color: #006cbc;
          font: 14px sans-serif;
          padding: 30px 0px;
        }
      `}</style>
    </div>
  );
}
