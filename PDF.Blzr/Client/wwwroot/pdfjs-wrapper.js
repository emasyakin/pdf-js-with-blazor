const pdfJSViewerFunctions = {
  state: {
    pdfDoc: null,
    pageNum: 1,
    scale: 1.5,
    canvasWrapper: null,
    pdfjsLib: null,
  },

  async init(canvasWrapper, url) {
    this.setupPdfJsLib();
    this.setupCanvasWrapper(canvasWrapper);
    await this.loadDocument(url);
    await this.renderPages();
  },

  setupPdfJsLib() {
    this.state.pdfjsLib = window['pdfjs-dist/build/pdf'];
    this.state.pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
  },

  setupCanvasWrapper(canvasWrapper) {
    this.state.canvasWrapper = canvasWrapper;
    this.state.canvasWrapper.style.display = 'flex';
    this.state.canvasWrapper.style.flexWrap = 'wrap';
  },

  async loadDocument(url) {
    this.state.pdfDoc = await this.state.pdfjsLib.getDocument(url).promise;
  },

  async renderPages() {
    for (let i = 1; i <= this.state.pdfDoc.numPages; i++) {
      await this.renderPage(i);
    }
  },

  async renderPage(num) {
    const canvas = document.createElement('canvas');
    this.state.canvasWrapper.appendChild(canvas);

    const page = await this.state.pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: this.state.scale });
    const canvasWidth = viewport.width;
    const canvasHeight = viewport.height;

    canvas.height = canvasHeight * window.devicePixelRatio;
    canvas.width = canvasWidth * window.devicePixelRatio;

    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport: viewport,
    };

    canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio);

    await page.render(renderContext).promise;
  },
};

window.pdfJSViewerFunctions = pdfJSViewerFunctions;
