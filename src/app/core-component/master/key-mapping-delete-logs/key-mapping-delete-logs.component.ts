import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HeaderService } from 'src/app/core/service/header/header.service';

@Component({
  selector: 'app-key-mapping-delete-logs',
  standalone: false,
  templateUrl: './key-mapping-delete-logs.component.html',
  styleUrl: './key-mapping-delete-logs.component.scss'
})
export class KeyMappingDeleteLogsComponent {
  deletedKeyMappings: any = []
  loadingdeletedKeyMappingsLogs: boolean = false;

  constructor(
      private activeModal: NgbActiveModal,
      private headerService: HeaderService
    ) {}

  ngOnInit(): void {
    this.getDeletedKeyMappingsLogs();
  }

  async getDeletedKeyMappingsLogs() {
    try {
      this.loadingdeletedKeyMappingsLogs = true
      let response = await this.headerService.getDeletedKeyMappingLogs().toPromise()
      if (response){
       this.deletedKeyMappings = response.sort((a: any, b: any) => {
        return new Date(b.created_on).getTime() - new Date(a.created_on).getTime();
      });
      }
    } catch (error) {
      this.deletedKeyMappings = []
    }finally{
      this.loadingdeletedKeyMappingsLogs = false
    }
  }

  closeModal() {
    this.activeModal.close();
  }
}
