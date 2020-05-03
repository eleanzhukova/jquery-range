'use strict';

/*
  jQuery plugin for range
  version: 1.0.0
  github: https://github.com/lexeevna/jquery-range
*/
(function($) {
  const defaults = {
    scale: [ 0, 100 ],
    step: 1,
    bounceStep: false,
    delta: 1,
    displayInfo: true,
    displayScale: true
  };

  class Range {
    /*
      Create an instanse
      input {HTML element} - input element for initialization,
      options {object} - custom settings
    */
    constructor(input, options) {
      this.range = null;
      this.inputTo = input;
      this.opt = options;

      return this;
    }

    get valuesLength() {
      return this.opt.scale.length;
    }

    get stepPercentage() {
      return (100 / (this.valuesLength - 1));
    }

    get sliderWidth() {
      if (this.__sliderWidth == undefined) {
        this.__sliderWidth = this.slider.width();
      }
      return this.__sliderWidth;
    }

    get sliderOffsetLeft() {
      if (this.__sliderOffsetLeft == undefined) {
          this.__sliderOffsetLeft = this.slider.offset().left;
      }
      return this.__sliderOffsetLeft;
    }

    init() {
      if (this.range) return this.range;

      this.range = $('<div />', { class: 'jquery-range' });
      this.slider = $('<div />', { class: 'jquery-range__slider' }).appendTo(this.range);
      this.sliderInner = $('<div />', { class: 'jquery-range__slider-inner' }).appendTo(this.slider);
      this.sliderOuter = $('<div />', { class: 'jquery-range__slider-outer' }).appendTo(this.slider);
      this.handleTo = $('<div />', { class: 'jquery-range__slider-handle', 'data-handle': 'to' }).appendTo(this.slider);
      if (this.opt.displayScale) this.addScale();
      if (this.opt.displayInfo) this.addInfo();

      if (this.opt.to || this.opt.from) this.generate();
      this.customize();
      this.activate();

      return this.range;
    }

    /*  
      Generate range start position,
      if we have «from»‎ or «to»‎ custom options 
    */
    generate() {
      if (this.opt.to) {
        this.inputTo.attr('name', 'to');
        this._updateHandleTo(this._getAbsolutePosition(this.opt.to), this.opt.to);
      }
      if (this.opt.from) {
        let startPosition = this._getAbsolutePosition(this.opt.from);
        if (this.opt.to == undefined) {
          this.opt.to = this.opt.scale[this.valuesLength - 1]; 
          this._updateHandleTo(100, this.opt.to);
        }
        this.inputFrom = $('<input />', { type: 'hidden', name: 'from', value: this.opt.from }).insertBefore(this.inputTo);
        this.handleFrom = $('<div />', { class: 'jquery-range__slider-handle', 'data-handle': 'from' }).css('left', startPosition + '%').appendTo(this.slider);
        this.sliderInner.css('left', startPosition + '%');
        this._updateHandleFrom(startPosition, this.opt.from);
      }

      if (this.opt.displayScale) this._updateScale();
    }

    activate() {
      this._bindHandle();
      this._bindResize();
    }

    destroy() {
      this._unbindHandle();
      this._unbindResize();
    }

    /*
      Set custom CSS properties
    */
    customize() {
      switch (this.opt.theme) {
        case 'fa':
          this.handleTo.html('<i class="fa ' + this.opt.handle + '" aria-hidden="true"></i>');
          if (this.opt.from) {
            this.handleFrom.html('<i class="fa ' + this.opt.handle + '" aria-hidden="true"></i>');
          }
          this.handleTo.css('color', this.opt.handleColor);
          if (this.opt.from) {
            this.handleFrom.css('color', this.opt.handleColor);
          }
          this.range.addClass('theme-fa');
          break;

        case 'round':
          this.range.addClass('theme-round');
          break;

        case 'quadrate':
          this.range.addClass('theme-quadrate');
          break;
      }
      this.slider.css('height', this.opt.sliderHeight);
      this.sliderInner.css('background', this.opt.innerColor);
      this.sliderOuter.css('background', this.opt.outerColor);
      this.handleTo.css({
        'background': this.opt.handleColor,
        'height': this.opt.handleSize,
        'width': this.opt.handleSize,
        'font-size': this.opt.handleSize,
        'margin-left': -this.opt.handleSize / 2
      });
      if (this.opt.from) {
        this.handleFrom.css({
          'background': this.opt.handleColor,
          'height': this.opt.handleSize,
          'width': this.opt.handleSize,
          'font-size': this.opt.handleSize,
          'margin-left': -this.opt.handleSize / 2
        });
      }
    }

    /*
      Add info to range
    */
    addInfo() {
      this.infoTo = $('<div />', { class: 'jquery-range__info', text: this.opt.scale[0], 'data-handle': 'to' }).appendTo(this.range);

      if (this.opt.from) {
        this.infoFrom = $('<div />', { class: 'jquery-range__info --from', text: this.opt.from, 'data-handle': 'from' }).css('left', this.startPosition + '%').appendTo(this.range); 
      }
    }

    /*
      Add scale to range
    */
    addScale() {
      this.scale = $('<div />', { class: 'jquery-range__scale' }).appendTo(this.range);

      this.values = $();
      for (let i = 0; i < this.valuesLength; i++) {
        let $value = $('<div />', { class: 'jquery-range__scale-value', text: this.opt.scale[i] }).css('left', this.stepPercentage * i + '%').appendTo(this.scale);      
        this.values = this.values.add($value);
      }
    }

    /*
      Define which step the value belongs to
      value {number} - value from scale
    */
    _defineStep(value) {
      for (let i = 0; i < this.valuesLength - 1; i++) {
        if ((value >= this.opt.scale[i]) && (value < this.opt.scale[i + 1])) {
          return i;
        }
      }
    }

    /*
      Get handle absolute position
      value {number} - value from scale
    */
    _getAbsolutePosition(value) {
      let stepIndex = this._defineStep(value);

      return this.stepPercentage * stepIndex + (value - this.opt.scale[stepIndex]) * this._getStepPercentage(stepIndex);
    }

    /*
      Get delta step percentage
      stepIndex {number}
    */
    _getStepPercentage(stepIndex) {
      return this.stepPercentage / ((this.opt.scale[stepIndex + 1] - this.opt.scale[stepIndex]) / this.opt.step);
    }

    /*
      Bind mouse and touch handle events
    */
    _bindHandle() {
      this.__startHandle = (e) => {
        this.handle = e.target.dataset.handle;
        $(document).on('mousemove touchmove', this.__moveHandle).on('mouseup touchend', this.__offHandle);
      }
      this.__moveHandle = (e) => {
        let offsetPercentage = this._definePosition(e);
        this._updatePosition(offsetPercentage);
      }
      this.__offHandle = (e) => {
        this.handle = '';
        $(document).off('mousemove touchmove', this.__moveHandle).off('mouseup touchend', this.__offHandle);
      }

      this.handleTo.on('mousedown touchstart', this.__startHandle);
      if (this.opt.from) this.handleFrom.on('mousedown touchstart', this.__startHandle);
    }

    /* 
      Unbind mouse and touch handle events
    */
    _unbindHandle() {
      this.handleTo.off('mousedown touchstart', this.__startHandle);
      if (this.opt.from) this.handleFrom.off('mousedown touchstart', this.__startHandle);

      delete this.__startHandle;
      delete this.__moveHandle;
      delete this.__offHandle;
    }

    /* 
      Bind resize events
    */
    _bindResize() {
      this.__resize = () => {
        delete this.__sliderWidth;
        delete this.__sliderOffsetLeft;

        
      }

      $(window).on('resize', this.__resize);
    }

    /*
      Unbind resize events
    */
    _unbindResize() {
      $(window).off('resize', this.__resize);

      delete this.__resize();
    }

    /*
      Define handle position at the moment
    */
    _definePosition(e) {
      let offsetPercentage;

      if (e.type == 'touchmove') {
        offsetPercentage = ((e.originalEvent.touches[0].pageX - this.sliderOffsetLeft) / this.sliderWidth) * 100;
      } else if (e.type == 'mousemove') {
        offsetPercentage =  ((e.pageX - this.sliderOffsetLeft) / this.sliderWidth) * 100;
      }

      if (offsetPercentage < 0) return 0;
      else if (offsetPercentage > 100) return 100;
      else return offsetPercentage;
    }

    /*
      Update «handle-to»‎ HTML values and CSS
      offsetPercentage {number} - current absolute «handle-to»‎ position
      value {number} - current scale value of «handle-to»‎
    */
    _updateHandleTo(offsetPercentage, value) {
      this.handleTo.css('left', offsetPercentage + '%');
      this.sliderInner.css('right', (100 - offsetPercentage) + '%');
      if (this.opt.displayInfo) {
        this.infoTo.css('left', offsetPercentage + '%');
        this.infoTo.html(value);
      }
      this.inputTo.val(value);
      this.offsetPercentageTo = offsetPercentage;
    }

    /*
      Update «handle-from»‎ HTML-values and CSS
      offsetPercentage {number} - current absolute position
      value {number} - current scale value
    */
    _updateHandleFrom(offsetPercentage, value) {
      this.handleFrom.css('left', offsetPercentage + '%');
      this.sliderInner.css('left', offsetPercentage + '%');
      this.infoFrom.css('left', offsetPercentage + '%');
      this.infoFrom.html(value);
      this.inputFrom.val(value);
      this.offsetPercentageFrom = offsetPercentage;
    }

    /*
      Calculate current handle position
      offsetPercentage {number} - current absolute position
    */
    _updatePosition(offsetPercentage) {       
      let stepIndex = Math.floor(offsetPercentage / this.stepPercentage),
          scaleIndex = Math.round(offsetPercentage / this.stepPercentage);
      if (offsetPercentage == 100) stepIndex--;

      let value;
      if (this.opt.bounceStep) {
        offsetPercentage = scaleIndex * this.stepPercentage;
        value = this.opt.scale[scaleIndex];
      } else {
        let deltaStepPercentage = this._getStepPercentage(stepIndex);
        value = this.opt.scale[stepIndex] + (Math.round((Math.round(offsetPercentage) - (this.stepPercentage * stepIndex)) / deltaStepPercentage) * this.opt.step);
      }
      
      if (this.opt.to && this.opt.from) {
        let deltaPercentage = this.offsetPercentageTo - this.offsetPercentageFrom;
        if (deltaPercentage < this.opt.delta) {
          if (this.handle == 'from') {
            if (offsetPercentage < this.offsetPercentageFrom) {
              this.offsetPercentageFrom = this.offsetPercentage;
              this._updateHandleFrom(offsetPercentage, value);
            }
          } else {
            if (offsetPercentage > this.offsetPercentageTo) {
              this.offsetPercentageTo = this.offsetPercentage;
              this._updateHandleTo(offsetPercentage, value);
            }
          }
        } else {
          if (this.handle == 'from') {
            this._updateHandleFrom(offsetPercentage, value);
          } else {
            this._updateHandleTo(offsetPercentage, value);
          }
        }
      } else {
        this._updateHandleTo(offsetPercentage, value);
      }
      if (this.opt.displayScale) this._updateScale();
    }

    /*
      Calculate which of scale values the range includes
    */
    _updateScale() {
      let scaleIndexFrom = 0,
          scaleIndexTo = Math.round(this.offsetPercentageTo) / this.stepPercentage;

      if (this.opt.to && this.opt.from) {
        scaleIndexFrom = Math.ceil(this.offsetPercentageFrom / this.stepPercentage);
      }

      for (let i = 0; i < this.valuesLength; i++) {
        if ((i >= scaleIndexFrom) && (i <= scaleIndexTo)) this.values.eq(i).addClass('is-active');
        else this.values.eq(i).removeClass('is-active');
      }
    }
  }

   $.fn.jQueryRange = function(option, settings) {
  if (typeof option == 'object') {
    settings = option;
  } else if (typeof option == 'string') {
    let values = [];

    let elements = this.each(function() {
      let data = $(this).data('_Range');

      if (data) {
        if (option == 'destroy') { 
          data.destroy(); 
        } else if (defaults[option] !== undefined) {
          if(settings !== undefined) { 
            data.settings[option] = settings; 
          } else { 
            values.push(data.settings[option]);
          }
        }
      }
    });

    if (values.length == 1) return values[0];
    if (values.length > 0) return values; 
    else return elements;
  }

  let $settings = $.extend({}, defaults, settings || {});

  return this.each(function() {
    let $this = $(this);

    let range = new Range($this, $settings);
    
    let $range = range.init();

    $range.insertAfter($this);

    $this.data('_Range', range);
  });
}  
}(jQuery));
