import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  constructor(private apiService: ApiService) {}

  getDataList(filter: any) {
    const queryParams = new URLSearchParams();

    if (filter.id !== undefined) queryParams.append('id', filter.id);
    if (filter.file_id !== undefined)
      queryParams.append('file_id', filter.file_id);
    if (filter.uploaded_on !== undefined)
      queryParams.append('uploaded_on', filter.uploaded_on);
    if (filter.store_code !== undefined)
      queryParams.append('store_code', filter.store_code);
    if (filter.brand !== undefined) queryParams.append('brand', filter.brand);
    if (filter.customer_name !== undefined)
      queryParams.append('customer_name', filter.customer_name);
    if (filter.bill_no !== undefined)
      queryParams.append('bill_no', filter.bill_no);
    if (filter.secondary_bill_date !== undefined)
      queryParams.append('secondary_bill_date', filter.secondary_bill_date);
    if (filter.material_style_code !== undefined)
      queryParams.append('material_style_code', filter.material_style_code);
    if (filter.ean !== undefined) queryParams.append('ean', filter.ean);
    if (filter.qty !== undefined) queryParams.append('qty', filter.qty);
    if (filter.mrp_per_unit !== undefined)
      queryParams.append('mrp_per_unit', filter.mrp_per_unit);
    if (filter.tot_mrp !== undefined)
      queryParams.append('tot_mrp', filter.tot_mrp);
    if (filter.discount !== undefined)
      queryParams.append('discount', filter.discount);
    if (filter.nsv !== undefined) queryParams.append('nsv', filter.nsv);
    if (filter.instance !== undefined)
      queryParams.append('instance', filter.instance);
    if (filter.remark !== undefined)
      queryParams.append('remark', filter.remark);
    if (filter.status !== undefined)
      queryParams.append('status', filter.status);
    if (filter.month !== undefined) queryParams.append('month', filter.month);
    if (filter.year !== undefined) queryParams.append('year', filter.year);
    if (filter.client_id !== undefined)
      queryParams.append('client_id', filter.client_id);
    if (filter.batch_id !== undefined)
      queryParams.append('batch_id', filter.batch_id);

    // return this.apiService.get(`data/list?${queryParams.toString()}`);
    return this.apiService.post(`data/list`, filter);
  }

  downloadSoList(filter: any) {
    const queryParams = new URLSearchParams();

    // Only allow filtering by batch_id and client_id for bulk download
    if (filter.client_id !== undefined)
      queryParams.append('client_id', filter.client_id);
    if (filter.batch_id !== undefined)
      queryParams.append('batch_id', filter.batch_id);

    return this.apiService.getFile(
      `data/download/stream?${queryParams.toString()}`
    );
  }

  deleteUploadedFile(fileId: any, remark: string) {
    const payload = {
      remark: remark,
    };
    return this.apiService.deleteByPayload('data/delete/' + fileId, 
      payload,
    );
  }

  getFileList(client_id:  any, year: string, month: any, brand: any, fromDate: any, toDate: any) {
     return this.apiService.get('data/file-list?year=' + year + '&month=' + month
     + '&brand=' + brand + '&fromDate=' + fromDate + '&toDate=' + toDate  + '&client_id=' + client_id
    );
  }
}
