import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonSharedService {
  public StoreListObject = new Subject<any>();
  public HeaderListObject = new Subject<any>();
  public ProductListObject = new Subject<any>();
  public selectedClientUUID = new BehaviorSubject<{
    result: boolean;
    uuid: string;
  } | null>(null);
  constructor() {}

  downloadFile(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.click();
    window.URL.revokeObjectURL(url); // Clean up
  }

  public downloadBlobFile(blob: any, fileName: any) {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(blobUrl);
  }

  dowmload(fileBlob: any) {
    const blobUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.click();
    URL.revokeObjectURL(blobUrl);
  }

  getMonthNumber(monthText: string): number {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthIndex = months.findIndex(
      (month) => month.toLowerCase() === monthText.toLowerCase()
    );
    return monthIndex !== -1 ? monthIndex + 1 : 1;
  }
}
