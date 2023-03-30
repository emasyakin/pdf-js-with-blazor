// pdfjs-wrapper.js

function recreateNode(el, withChildren) {
  if (withChildren) {
    el.parentNode.replaceChild(el.cloneNode(true), el);
  } else {
    const newEl = el.cloneNode(false);
    while (el.hasChildNodes()) newEl.appendChild(el.firstChild);
    el.parentNode.replaceChild(newEl, el);
  }
}

const pdfJSViewerFunctions = {
  state: {
    pdfDoc: null,
    pageNum: 1,
    pageRendering: false,
    pageNumPending: null,
    scale: 0.8,
    canvas: null,
    ctx: null,
    currentPage: null,
  },

  init(element, url) {
    this.setupCanvas(element);
    this.setupPdfJsLib();
    this.loadDocument(url);
  },

  setupCanvas(element) {
    this.state.canvas = element;
    this.state.ctx = this.state.canvas.getContext('2d');

    this.state.canvas.style.overflowY = 'scroll';
    this.state.canvas.addEventListener('scroll', this.throttle(this.onScroll.bind(this), 200));
  },

  setupPdfJsLib() {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
  },

  loadDocument(url) {
    const { pdfjsLib } = window['pdfjs-dist/build/pdf'];

    pdfjsLib.getDocument(url).promise.then((pdfDoc_) => {
      if (this.state.currentPage) {
        this.state.currentPage.cleanup();
        this.state.pageRendering = false;
      }

      if (this.state.pdfDoc) {
        this.state.pdfDoc.destroy();
      }

      if (this.state.ctx) {
        this.state.ctx.clearRect(0, 0, this.state.canvas.width, this.state.canvas.height);
        this.state.ctx.beginPath();
      }

      this.state.pdfDoc = pdfDoc_;
      document.getElementById('page_count').textContent = this.state.pdfDoc.numPages;

      this.renderPage(this.state.pageNum);
    });
  },

  renderPage(num) {
    this.state.pageRendering = true;

    this.state.pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale: this.state.scale });
      this.state.canvas.height = viewport.height;
      this.state.canvas.width = viewport.width;

      const renderContext = {
        canvasContext: this.state.ctx,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      this.state.currentPage = page;

      renderTask.promise.then(() => {
        this.state.pageRendering = false;
        if (this.state.pageNumPending !== null) {
          this.renderPage(this.state.pageNumPending);
          this.state.pageNumPending = null;
        }
      });
    });

    document.getElementById('page_num').textContent = num;
  },

  queueRenderPage(num) {
    if (this.state.pageRendering) {
      this.state.pageNumPending = num;
    } else {
      this.renderPage(num);
    }
  },

  onPrevPage() {
    if (this.state.pageNum <= 1) {
      return;
    }
    this.state.pageNum--;
    this.queueRenderPage(this.state.pageNum);
  },

  onNextPage() {
    if (this.state.pageNum >= this.state.pdfDoc.numPages) {
      return;
    }
    this.state.pageNum++;
    this.queueRenderPage(this.state.pageNum);
  },

  onScroll() {
    if (this.state.canvas.scrollTop + this.state.canvas.clientHeight >= this.state.canvas.scrollHeight) {
      this.onNextPage();
    }
    else if (this.state.canvas.scrollTop === 0) {
      this.onPrevPage();
    }
  },

  throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return func.apply(this, args);
    };
  },
};

window.pdfJSViewerFunctions = pdfJSViewerFunctions;
