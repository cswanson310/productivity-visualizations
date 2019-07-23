import Link from 'next/link';

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
      <div id="crumbs">
        <Link href="/teams">
          <a>
            <Crumb text="TEAMS" first="first" />
          </a>
        </Link>
        {props.team && 
          <span className="sep">
            >
          </span>
        }
        {props.team && <Crumb text={props.team} />}
      </div>
      <style jsx>{`
        #header {
          background: #fafbfc;
        }
        .sep {
          font-family: Helvetica;
          font-weight: bold;
        }
        #crumbs {
          vertical-align: center;
          padding: 2.5vh 7vw;
        }
        #crumbs a:first-child {
          padding-left: 0px;
        }
        #crumbs a {
          text-decoration: none;
        }
        #crumbs a:hover {
          cursor: pointer;
          text-decoration: underline;
        }
        #crumbs span {
          color: #006cbc;
          font: 14px sans-serif;
          padding: 3vh 0px;
        }
      `}</style>
    </div>
  );
}
