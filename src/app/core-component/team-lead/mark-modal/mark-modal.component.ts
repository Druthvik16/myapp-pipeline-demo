import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ListService } from 'src/app/core/service/list/list.service';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';

@Component({
  selector: 'app-mark-modal',
  standalone: false,
  templateUrl: './mark-modal.component.html',
  styleUrl: './mark-modal.component.scss',
})

export class MarkModalComponent {
  @Input() row: any;
  remark: string = '';
  @Input() originalIndex!: number;
  @Input() headerMapping: any;
  @Input() modalParams: any
  fileName: string = ""

  constructor(
    private activeModal: NgbActiveModal,
    private listService: ListService,
    private commonSharedService: CommonSharedService
  ) {}

   ngOnInit() {
    this.fileName = this.modalParams.fileName
  }

  yesDuplicate() {
    const result = {
      action: 'remove',
      fullRow: this.row,
      originalIndex: this.originalIndex,
      remark: this.remark || '',
    };
    this.activeModal.close(result);
  }

  getMonthIndex = (monthText: string): number => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.indexOf(monthText) + 1;
  };
  
  async noDuplicate() {
    try {
      const monthNumber = this.commonSharedService.getMonthNumber(this.row[this.headerMapping['Month']])
      const filter = {
        store_code: this.row[this.headerMapping['Customer code']],
        brand: this.row[this.headerMapping['Brand']],
        month: monthNumber,
        year: this.row[this.headerMapping['Year']],
      };
      let response = await this.listService.getDataList(filter).toPromise();
      if (response) {
        const maxInstance = Math.max(
          ...response.map((r: any) => Number(r.instance || 0))
        );
        const newInstance = maxInstance + 1;
        this.row['Instance'] = newInstance;
        this.row['status'] = 'not-duplicate';
        const result = {
          action: 'updatedInstance',
          updatedRow: this.row,
          remark: this.remark,
        };
        this.activeModal.close(result);
      }
    } catch (error) {}
  }

  closeModal() {
    this.activeModal.close();
  }
}
