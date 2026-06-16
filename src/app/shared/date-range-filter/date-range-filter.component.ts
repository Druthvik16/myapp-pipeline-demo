import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BsDaterangepickerConfig } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-date-range-filter',
  standalone: false,
  templateUrl: './date-range-filter.component.html',
  styleUrl: './date-range-filter.component.scss',
})
export class DateRangeFilterComponent {
  @Input() uploadedOnRange: Date[] | null = null;
  @Input() updatedOnRange: Date[] | null = null;
  @Output() apply = new EventEmitter<{
    uploadedOn: Date[] | null;
    updatedOn: Date[] | null;
  }>();

  bsDateConfig: Partial<BsDaterangepickerConfig> = {
    dateInputFormat: 'DD/MM/YYYY',
    containerClass: 'theme-default',
    rangeInputFormat: 'DD/MM/YYYY',
    showWeekNumbers: false,
    adaptivePosition: false,
  };
  tempUploadedOnRange: Date[] | null = null;
  tempUpdatedOnRange: Date[] | null = null;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    this.tempUploadedOnRange = this.uploadedOnRange;
    this.tempUpdatedOnRange = this.updatedOnRange;
  }

  applyFilters() {
    this.apply.emit({
      uploadedOn: this.tempUploadedOnRange,
      updatedOn: this.tempUpdatedOnRange,
    });
    this.activeModal.close();
  }

  get formattedTempUpdatedOnRange(): string {
    if (!this.tempUpdatedOnRange || this.tempUpdatedOnRange.length !== 2)
      return '';
    const [start, end] = this.tempUpdatedOnRange;
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  get formattedTempUploadedOnRange(): string {
    if (!this.tempUploadedOnRange || this.tempUploadedOnRange.length !== 2)
      return '';
    const [start, end] = this.tempUploadedOnRange;
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  resetTempFields() {
    this.tempUploadedOnRange = null;
    this.tempUpdatedOnRange = null;
  }
}
