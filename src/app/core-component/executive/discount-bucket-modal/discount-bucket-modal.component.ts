import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { DiscountService } from 'src/app/core/service/discount/discount.service';
import { CommonSharedService } from 'src/app/core/service/common-shared/common-shared.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-discount-bucket-modal',
  templateUrl: './discount-bucket-modal.component.html',
  styleUrls: ['./discount-bucket-modal.component.scss'],
  imports: [FormsModule],
  standalone: true
})
export class DiscountBucketModalComponent implements OnInit {
  @Input() selectedData: any[] = [];
  @Input() filteredData: any[] = [];

  bucketId: string = crypto.randomUUID();
  bucketName: string = '';
  bucketDescription: string = '';
  user: any;
  clientUuid: string = '';
  isLoading: boolean = false;

  constructor(
    public activeModal: NgbActiveModal, 
    private discountService: DiscountService,
    private commonSharedService: CommonSharedService
  ) {}

  ngOnInit() {
    this.user = JSON.parse(sessionStorage.getItem('LOGINUSER') || '{}');
    const storedClient = this.commonSharedService.selectedClientUUID.value;
    if (storedClient?.result && storedClient.uuid) {
      this.clientUuid = storedClient.uuid;
    }
  }

  closeModal(): void {
    this.activeModal.close();
  }

  async createBucket(): Promise<void> {
    // Prevent multiple API calls
    if (this.isLoading) {
      return;
    }

    // Validate required fields
    if (!this.bucketId?.trim()) {
      Swal.fire({
        icon: 'error',
        text: 'Please enter a Bucket ID',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    if (!this.bucketName?.trim()) {
      Swal.fire({
        icon: 'error',
        text: 'Please enter a Bucket Name',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    if (!this.bucketDescription?.trim()) {
      Swal.fire({
        icon: 'error',
        text: 'Please enter a Bucket Description',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    this.isLoading = true;
    let ids = this.selectedData.map((item: any) => item.id);
    const payload = {
      batch_id: this.bucketId.trim(),
      batch_name: this.bucketName.trim(),
      batch_description: this.bucketDescription.trim(),
      data: ids,
      created_by: this.user.id,
      row_count: ids.length,
      client_uuid: this.clientUuid,
    };
    try {
      await this.discountService.createDiscountBatch(payload).toPromise();
      Swal.fire({
        icon: 'success',
        text: 'Discount batch created successfully!',
        confirmButtonColor: '#3085d6'
      });
      this.activeModal.close(payload);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        text: 'Failed to create discount batch.',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      // Reset loading state
      this.isLoading = false;
    }
  }
} 