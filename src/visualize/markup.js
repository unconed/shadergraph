/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { hash } from "../factory/hash";

const trim = (string) => ("" + string).replace(/^\s+|\s+$/g, "");

const cssColor = (r, g, b, alpha) =>
  "rgba(" + [r, g, b, alpha].join(", ") + ")";

const hashColor = function (string, alpha) {
  if (alpha == null) {
    alpha = 1;
  }
  const color = hash(string) ^ 0x123456;

  let r = color & 0xff;
  let g = (color >>> 8) & 0xff;
  let b = (color >>> 16) & 0xff;

  const max = Math.max(r, g, b);
  const norm = 140 / max;
  const min = Math.round(max / 3);

  r = Math.min(255, Math.round(norm * Math.max(r, min)));
  g = Math.min(255, Math.round(norm * Math.max(g, min)));
  b = Math.min(255, Math.round(norm * Math.max(b, min)));

  return cssColor(r, g, b, alpha);
};

const escapeText = function (string) {
  string = string != null ? string : "";
  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");
};

export const process = function (data) {
  const links = [];
  const el = _markup(data, links);
  el.update = () => connect(el, links);
  _activate(el);
  return el;
};

var _activate = function (el) {
  const codes = el.querySelectorAll(".shadergraph-code");
  return Array.from(codes).map((code) =>
    (function () {
      const popup = code;
      popup.parentNode.classList.add("shadergraph-has-code");
      return popup.parentNode.addEventListener(
        "click",
        (_event) =>
          (popup.style.display = {
            block: "none",
            none: "block",
          }[popup.style.display || "none"])
      );
    })()
  );
};

const _order = function (data) {
  let link, node;
  const nodeMap = {};
  const linkMap = {};
  for (node of Array.from(data.nodes)) {
    nodeMap[node.id] = node;
  }

  for (link of Array.from(data.links)) {
    if (linkMap[link.from] == null) {
      linkMap[link.from] = [];
    }
    linkMap[link.from].push(link);
  }

  var recurse = function (node, depth) {
    let next;
    if (depth == null) {
      depth = 0;
    }
    node.depth = Math.max(node.depth != null ? node.depth : 0, depth);
    if ((next = linkMap[node.id])) {
      for (link of Array.from(next)) {
        recurse(nodeMap[link.to], depth + 1);
      }
    }
    return null;
  };

  for (node of Array.from(data.nodes)) {
    if (node.depth == null) {
      recurse(node);
    }
  }

  return null;
};

var _markup = function (data, links) {
  let column;
  _order(data);

  const wrapper = document.createElement("div");
  wrapper.classList.add("shadergraph-graph");

  const columns = [];
  const outlets = {};

  for (let node of Array.from(data.nodes)) {
    var outlet;
    var block = document.createElement("div");
    block.classList.add("shadergraph-node");
    block.classList.add(`shadergraph-node-${node.type}`);

    block.innerHTML = `\
<div class="shadergraph-header">${escapeText(node.name)}</div>\
`;

    const addOutlet = function (outlet, inout) {
      const color = hashColor(outlet.type);

      const div = document.createElement("div");
      div.classList.add("shadergraph-outlet");
      div.classList.add(`shadergraph-outlet-${inout}`);
      div.innerHTML = `\
<div class="shadergraph-point" style="background: ${color}"></div>
<div class="shadergraph-type" style="color: ${color}">${escapeText(
        outlet.type
      )}</div>
<div class="shadergraph-name">${escapeText(outlet.name)}</div>\
`;
      block.appendChild(div);

      return (outlets[outlet.id] = div.querySelector(".shadergraph-point"));
    };

    for (outlet of Array.from(node.inputs)) {
      addOutlet(outlet, "in");
    }
    for (outlet of Array.from(node.outputs)) {
      addOutlet(outlet, "out");
    }

    if (node.graph != null) {
      block.appendChild(_markup(node.graph, links));
    } else {
      const clear = document.createElement("div");
      clear.classList.add("shadergraph-clear");
      block.appendChild(clear);
    }

    if (node.code != null) {
      const div = document.createElement("div");
      div.classList.add("shadergraph-code");
      div.innerHTML = escapeText(trim(node.code));
      block.appendChild(div);
    }

    column = columns[node.depth];
    if (column == null) {
      column = document.createElement("div");
      column.classList.add("shadergraph-column");
      columns[node.depth] = column;
    }
    column.appendChild(block);
  }

  for (column of Array.from(columns)) {
    if (column != null) {
      wrapper.appendChild(column);
    }
  }

  for (let link of Array.from(data.links)) {
    const color = hashColor(link.type);

    links.push({
      color,
      out: outlets[link.out],
      in: outlets[link.in],
    });
  }

  return wrapper;
};

const sqr = (x) => x * x;

const path = function (x1, y1, x2, y2) {
  let h;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(sqr(dx) + sqr(dy));

  const vert = Math.abs(dy) > Math.abs(dx);
  if (vert) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    const f = dy > 0 ? 0.3 : -0.3;
    h = Math.min(Math.abs(dx) / 2, 20 + d / 8);

    return [
      "M",
      x1,
      y1,
      "C",
      x1 + h,
      y1 + ",",
      mx,
      my - d * f,
      mx,
      my,
      "C",
      mx,
      my + d * f,
      x2 - h,
      y2 + ",",
      x2,
      y2,
    ].join(" ");
  } else {
    h = Math.min(Math.abs(dx) / 2.5, 20 + d / 4);

    return ["M", x1, y1, "C", x1 + h, y1 + ",", x2 - h, y2 + ",", x2, y2].join(
      " "
    );
  }
};

const makeSVG = function (tag) {
  if (tag == null) {
    tag = "svg";
  }
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
};

var connect = function (element, links) {
  let link;
  if (element.parentNode == null) {
    return;
  }

  const ref = element.getBoundingClientRect();

  for (link of Array.from(links)) {
    const a = link.out.getBoundingClientRect();
    const b = link.in.getBoundingClientRect();

    link.coords = {
      x1: (a.left + a.right) / 2 - ref.left,
      y1: (a.top + a.bottom) / 2 - ref.top,
      x2: (b.left + b.right) / 2 - ref.left,
      y2: (b.top + b.bottom) / 2 - ref.top,
    };
  }

  let svg = element.querySelector("svg");
  if (svg != null) {
    element.removeChild(svg);
  }

  let box = element;
  while (box.parentNode && box.offsetHeight === 0) {
    box = box.parentNode;
  }

  svg = makeSVG();
  svg.setAttribute("width", box.offsetWidth);
  svg.setAttribute("height", box.offsetHeight);

  for (link of Array.from(links)) {
    const c = link.coords;

    const line = makeSVG("path");
    line.setAttribute("d", path(c.x1, c.y1, c.x2, c.y2));
    line.setAttribute("stroke", link.color);
    line.setAttribute("stroke-width", 3);
    line.setAttribute("fill", "transparent");
    svg.appendChild(line);
  }

  return element.appendChild(svg);
};

export const overlay = function (contents) {
  const div = document.createElement("div");
  div.setAttribute("class", "shadergraph-overlay");

  const close = document.createElement("div");
  close.setAttribute("class", "shadergraph-close");
  close.innerHTML = "&times;";

  const view = document.createElement("div");
  view.setAttribute("class", "shadergraph-view");

  const inside = document.createElement("div");
  inside.setAttribute("class", "shadergraph-inside");

  inside.appendChild(contents);
  view.appendChild(inside);
  div.appendChild(view);
  div.appendChild(close);

  close.addEventListener("click", () => div.parentNode.removeChild(div));

  return div;
};

const wrap = function (markup) {
  if (markup instanceof Node) {
    return markup;
  }
  const p = document.createElement("span");
  p.innerText = markup != null ? markup : "";
  return p;
};

export const merge = function (markup) {
  if (markup.length !== 1) {
    let el;
    const div = document.createElement("div");
    for (el of Array.from(markup)) {
      div.appendChild(wrap(el));
    }
    div.update = () =>
      (() => {
        const result = [];
        for (el of Array.from(markup)) {
          result.push(
            typeof el.update === "function" ? el.update() : undefined
          );
        }
        return result;
      })();
    return div;
  } else {
    return wrap(markup[0]);
  }
};
