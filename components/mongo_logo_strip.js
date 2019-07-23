export default function MongoLogoStrip(props) {
  return (
    <div id="mongo-logo-header">
      <div id="img-block">
        <img src="/static/mongodb-logo.png" alt="MongoDB"/>
      </div>
      <style jsx>{`
        #mongo-logo-header {
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
          padding: 10px 4vh;
          width: 120px;
        }
        .sep {
          font-family: Helvetica;
          font-weight: bold;
        }
        #crumbs {
          vertical-align: center;
          padding: 2.5vh 7vw;
        }
        #crumbs:first-child {
          padding-left: 0px;
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

