(() => {
    const client = stitch.Stitch.initializeDefaultAppClient('productivity_viz-mtrvv');

    const db = client.getServiceClient(stitch.RemoteMongoClient.factory, 'productivity_viz')
                   .db('codereview');

    let days = 14;
    const startDate = new Date(moment().subtract(days, "days"));
    console.log(startDate);
    d3.select("#days-display").text(days);
    const team = [
        "ian.boros",
        "martin.neupauer",
        "samuel.mercier",
        "justin.seyster",
        "misha.ivkov",
        "david.storch",
        "jacob.evans",
        "pawel.terlecki",
        "charlie.swanson",
        "george.wangensteen",
        "xinhao.zhang",
        "james.wahlin",
        "nicholas.zolnierz",
        "davis.haupt",
        "ted.tuckman",
        "bernard.gorman",
        "arun.banala",
        "anton.korshunov"
    ];
    const teamEmails = team.map(n => n + "@10gen.com");

    const aggPrefix = [
        {$match: {created: {$gte: startDate.toISOString()}}},
        {
          $match:
              {$or: [{owner: {$in: team}}, {reviewers: {$in: team.map(n => n + "@10gen.com")}}]}
        },
        {$unwind: "$reviewers"},
        {$addFields: {owner: {$cond: [{$in: ["$owner", team]}, "$owner", "Outside Team"]}}},
        {
          $addFields: {
              reviewers:
                  {$cond: [{$in: ["$reviewers", teamEmails]}, "$reviewers", "Outside Team"]}
          }
        },
        {$match: {$or: [{owner: {$ne: "Outside Team"}}, {reviewers: {$ne: "Outside Team"}}]}}
    ];
    client.auth.loginWithCredential(new stitch.AnonymousCredential())
        .then(user => {
            return db.collection('issues')
                .aggregate(aggPrefix.concat([
                    {$group: {_id: {sender: "$owner", reviewer: "$reviewers"}, count: {$sum: 1}}},
                    {
                      $group: {
                          _id: "$_id.reviewer",
                          incoming: {$push: {sender: "$_id.sender", count: "$count"}}
                      }
                    },
                    {$addFields: {total_incoming: {$sum: "$incoming.count"}}},
                    {$sort: {total_incoming: -1}}
                ]))
                .toArray();
        })
        .then(by_reviewer => {
            this.by_reviewer = by_reviewer;
            return db.collection('issues')
                .aggregate(aggPrefix.concat([
                    {$group: {_id: {sender: "$owner", reviewer: "$reviewers"}, count: {$sum: 1}}},
                    {
                      $group: {
                          _id: "$_id.sender",
                          targets: {$push: {reviewer: "$_id.reviewer", count: "$count"}}
                      }
                    },
                    {$addFields: {total_sent: {$sum: "$targets.count"}}},
                    {$sort: {total_sent: -1}}
                ]))
                .toArray();
        })
        .then(by_sender => {

            function fixEmail(email) {
                let at_idx = email.indexOf("@");
                return at_idx === -1 ? email : email.slice(0, email.indexOf("@"))
            }

            function isTeamMember(email) {
                return team.indexOf(fixEmail(email)) !== -1;
            }

            if (by_sender.length == 0) {
                d3.select("#chart").append("p").text("No issues found");
                return;
            }

            let nodes = [];
            let numNodes = 0;
            let links = [];

            for (let top_sender of by_sender) {
                for (let target of top_sender.targets) {
                    links.push(
                        {source: numNodes, value: target.count, target: fixEmail(target.reviewer)});
                }
                nodes.push(
                    {name: top_sender._id + " (" + top_sender.total_sent + ")", node: numNodes++});
            }

            let reviewer_node_map = {};
            for (let top_reviewer of this.by_reviewer) {
                nodes.push({
                    name: fixEmail(top_reviewer._id) + " (" + top_reviewer.total_incoming + ")",
                    node: numNodes
                });
                reviewer_node_map[fixEmail(top_reviewer._id)] = numNodes++;
            }
            for (let link of links) {
                link.target = reviewer_node_map[link.target];
            }

            d3_json = {nodes: nodes, links: links};

            var units = "reviews";

            // set the dimensions and margins of the graph
            var margin = {top: 10, right: 10, bottom: 10, left: 10},
                width = 700 - margin.left - margin.right, height = 700 - margin.top - margin.bottom;

            // format variables
            var formatNumber = d3.format(",.0f"),  // zero decimal places
                format = function(d) {
                    return formatNumber(d) + " " + units;
                }, color = d3.scaleOrdinal(d3.schemeCategory20);

            // append the svg object to the body of the page
            var svg = d3.select("#chart")
                          .append("svg")
                          .attr("width", width + margin.left + margin.right)
                          .attr("height", height + margin.top + margin.bottom)
                          .append("g")
                          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // Set the sankey diagram properties
            var sankey = d3.sankey().nodeWidth(36).nodePadding(40).size([width, height]);

            var path = sankey.link();

            // load the data
            sankey.nodes(d3_json.nodes).links(d3_json.links).layout(4);

            sankey.nodeSort = (n1, n2) => n1.node - n2.node;

            // add in the links
            var link = svg.append("g")
                           .selectAll(".link")
                           .data(d3_json.links)
                           .enter()
                           .append("path")
                           .attr("class", "link")
                           .attr("d", path)
                           .style("stroke-width",
                                  function(d) {
                                      return Math.max(1, d.dy);
                                  })
                           .sort(function(a, b) {
                               return b.dy - a.dy;
                           });

            // add the link titles
            link.append("title").text(function(d) {
                return d.source.name + " → " + d.target.name + "\n" + format(d.value);
            });

            // add in the nodes
            var node = svg.append("g")
                           .selectAll(".node")
                           .data(d3_json.nodes)
                           .enter()
                           .append("g")
                           .attr("class", "node")
                           .attr("transform",
                                 function(d) {
                                     return "translate(" + d.x + "," + d.y + ")";
                                 })
                           .on("click", function(e) {
                               console.log(e);
                               d3.select("#click-name").text(e.name);
                           });

            // add the rectangles for the nodes
            node.append("rect")
                .attr("height",
                      function(d) {
                          return d.dy;
                      })
                .attr("width", sankey.nodeWidth())
                .style("fill",
                       function(d) {
                           return d.color = color(d.name.replace(/ .*/, ""));
                       })
                .style("stroke",
                       function(d) {
                           return d3.rgb(d.color).darker(2);
                       })
                .append("title")
                .text(function(d) {
                    return d.name + "\n" + format(d.value);
                });

            // add in the title for the nodes
            node.append("text")
                .attr("x", -6)
                .attr("y",
                      function(d) {
                          return d.dy / 2;
                      })
                .attr("dy", ".35em")
                .attr("text-anchor", "end")
                .attr("transform", null)
                .text(function(d) {
                    return d.name;
                })
                .filter(function(d) {
                    return d.x < width / 2;
                })
                .attr("x", 6 + sankey.nodeWidth())
                .attr("text-anchor", "start");

            // the function for moving the nodes
            function dragmove(d) {
                d3.select(this).attr("transform",
                                     "translate(" + d.x + "," +
                                         (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) +
                                         ")");
                sankey.relayout();
                link.attr("d", path);
            }
        })
        .catch(err => {console.error(err)});
})();
