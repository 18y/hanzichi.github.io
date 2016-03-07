(function(exports, doc) {
  
  Function.prototype.bind = Function.prototype.bind || function(context) {
    var that = this;
    return function() {
      return that.apply(context, arguments);
    };
  };
  
  var T = {};

  T.getElementsByClassName = function(cls) {
    if (doc.getElementsByClassName)
      return doc.getElementsByClassName(cls);

    var o = doc.getElementsByTagName("*")
      , rs = [];

    for (var i = 0, t, len = o.length; i < len; i++) 
      (t = o[i]) && ~t.className.indexOf(cls) && rs.push(t);

    return rs;
  };

  T.addEvent = function(ele, type, fn) {
    ele.attachEvent ? ele.attachEvent("on" + type, fn) : ele.addEventListener(type, fn, false);
  };

  T.removeEvent = function(ele, type, fn) {
    ele.detachEvent ? ele.detachEvent("on" + type, fn) : ele.removeEventListener(type, fn, false);
  };

  T.getPos = function(ele) {
    var pos = {
      x: 0,
      y: 0
    };
    while (ele.offsetParent) {
      pos.x += ele.offsetLeft;
      pos.y += ele.offsetTop;
      ele = ele.offsetParent;
    }
    return pos;
  };

  T.getViewport = function() {
    var html = doc.documentElement;
    return { 
      w: !window.innerWidth ? html.clientHeight : window.innerWidth,
      h: !window.innerHeight ? html.clientHeight : window.innerHeight
    };
  };

  T.getScrollHeight = function() {
    html = doc.documentElement, bd = doc.body;
    return Math.max(window.pageYOffset || 0, html.scrollTop, bd.scrollTop);
  };

  T.getEleSize = function(ele) {
    return {
      w: ele.offsetWidth,
      h: ele.offsetHeight
    };
  };

  T.datalazyload = {
    threshold: 150,  // {number} ��ֵ��Ԥ���ظ߶ȣ���λ(px)
    els: null,       // {Array} �ӳټ���Ԫ�ؼ���(����), class='datalazyload'
    fn: null,        // {Function} scroll��resize��touchmove ���󶨷�������Ϊ pollTextareas()

    evalScripts: function(code) {
      var head = doc.getElementsByTagName("head")[0]
        , js = doc.createElement("script");

      js.text = code;
      head.insertBefore(js, head.firstChild);
      head.removeChild(js);
    },

    evalStyles: function(code) {
      var head = doc.getElementsByTagName("head")[0]
        , css = doc.createElement("style");

      css.type = "text/css";
      try {
        css.appendChild(doc.createTextNode(code));
      } catch (e) {
        css.styleSheet.cssText = code;
      }
      head.appendChild(css);
    },

    extractCode: function(str, isStyle) {
      var cata = isStyle ? "style" : "script"
        , scriptFragment = "<" + cata + "[^>]*>([\\S\\s]*?)</" + cata + "\\s*>"
        , matchAll = new RegExp(scriptFragment, "img")
        , matchOne = new RegExp(scriptFragment, "im")
        , matchResults = str.match(matchAll) || [] 
        , ret = [];

      for (var i = 0, len = matchResults.length; i < len; i++) {
        var temp = (matchResults[i].match(matchOne) || [ "", "" ])[1];
        temp && ret.push(temp);
      }
      return ret;
    },

    decodeHTML: function(str) {
      return str.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    },
    
    insert: function(ele) {
      var parent = ele.parentNode
        , div = doc.createElement("div")
        , txt = this.decodeHTML(ele.innerHTML)
        , matchStyles = this.extractCode(txt, true)
        , matchScripts = this.extractCode(txt);

      div.innerHTML = txt
        .replace(new RegExp("<script[^>]*>([\\S\\s]*?)</script\\s*>", "img"), "")
        .replace(new RegExp("<style[^>]*>([\\S\\s]*?)</style\\s*>", "img"), "");

      if (matchStyles.length) 
        for (var i = matchStyles.length; i --;) 
          this.evalStyles(matchStyles[i]);

      // ����ӳٲ�����Ҫ�� loading Ч��
      // parent.className = parent.className.replace("loading", "").trim();

      parent.replaceChild(div, ele);
      div.style.display = "";

      if (matchScripts.length) 
        for (var i = 0, len = matchScripts.length; i < len; i++) 
          this.evalScripts(matchScripts[i]);
    },

    inView: function(ele) {
      var top = T.getPos(ele).y
        , viewVal = T.getViewport().h
        , scrollVal = T.getScrollHeight()
        , eleHeight = T.getEleSize(ele).h;

      if (top >= scrollVal  - eleHeight - this.threshold && top <= scrollVal + viewVal + this.threshold) {
        return true;
      }

      return false;
    },

    pollTextareas: function() {
      // ���ӳټ��ص�Ԫ���Ѿ�ȫ��������
      if (!this.els.length) {
        T.removeEvent(window, "scroll", this.fn);
        T.removeEvent(window, "resize", this.fn);
        T.removeEvent(doc.body, "touchMove", this.fn);
        return;
      }

      // �ж��Ƿ���Ҫ����
      for (var i = this.els.length; i--; ) {
        var ele = this.els[i];

        if (!this.inView(ele)) 
          continue;

        this.insert(ele);
        this.els.splice(i, 1);
      }
    },

    init: function(cls) {
      this.els = Array.prototype.slice.call(T.getElementsByClassName(cls));
      this.fn = this.pollTextareas.bind(this);

      this.fn();
      T.addEvent(window, "scroll", this.fn);
      T.addEvent(window, "resize", this.fn);
      T.addEvent(doc.body, "touchMove", this.fn);
    }
  };

  exports["T"] = T;
})(window, document);

T.datalazyload.init("datalazyload");