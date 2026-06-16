import { Component } from '@angular/core';
import {
  pageSelection,
  pageSize,
  pageSizeCal,
  PaginationService,
} from './pagination.service';

@Component({
  selector: 'app-custom-pagination',
  templateUrl: './custom-pagination.component.html',
  styleUrls: ['./custom-pagination.component.scss'],
  standalone: false,
})
export class CustomPaginationComponent {
  public pageSize = 10;
  public tableData: Array<string> = [];
  // pagination variables
  public lastIndex = 0;
  public totalData = 0;
  public skip = 0;
  public limit: number = this.pageSize;
  public pageIndex = 0;
  public serialNumberArray: Array<number> = [];
  public currentPage = 1;
  public pageNumberArray: Array<number> = [];
  public pageSelection: Array<pageSelection> = [];
  public totalPages = 0;
  //** / pagination variables

  constructor(private pagination: PaginationService) {
    this.tableData = [];
    this.pagination.calculatePageSize.subscribe((res: pageSizeCal) => {
      this.calculateTotalPages(
        res.totalData,
        res.pageSize,
        res.tableData,
        res.serialNumberArray
      );
      this.pageSize = res.pageSize;
    });
    this.pagination.changePagesize.subscribe((res: pageSize) => {
      this.changePageSize(res.pageSize);
    });
  }

  // public getMoreData(event: string): void {
  //   if (event == 'next') {
  //     this.currentPage++;
  //     this.pageIndex = this.currentPage - 1;
  //     this.limit += this.pageSize;
  //     this.skip = this.pageSize * this.pageIndex;
  //     // this.getTableData();
  //     this.pagination.tablePageSize.next({
  //       skip: this.skip,
  //       limit: this.limit,
  //       pageSize: this.pageSize,
  //     });
  //   } else if (event == 'previous') {
  //     this.currentPage--;
  //     this.pageIndex = this.currentPage - 1;
  //     this.limit -= this.pageSize;
  //     this.skip = this.pageSize * this.pageIndex;
  //     // this.getTableData();
  //     this.pagination.tablePageSize.next({
  //       skip: this.skip,
  //       limit: this.limit,
  //       pageSize: this.pageSize,
  //     });
  //   }
  // }

  public getMoreData(event: string): void {
    if (event === 'next' && this.currentPage < this.totalPages) {
      this.moveToPage(this.currentPage + 1);
    } else if (event === 'previous' && this.currentPage > 1) {
      this.moveToPage(this.currentPage - 1);
    }
  }

  // public moveToPage(pageNumber: number): void {
  //   this.currentPage = pageNumber;
  //   this.skip = this.pageSelection[pageNumber - 1].skip;
  //   this.limit = this.pageSelection[pageNumber - 1].limit;
  //   if (pageNumber > this.currentPage) {
  //     this.pageIndex = pageNumber - 1;
  //   } else if (pageNumber < this.currentPage) {
  //     this.pageIndex = pageNumber + 1;
  //   }
  //   // this.getTableData();
  //   this.pagination.tablePageSize.next({
  //     skip: this.skip,
  //     limit: this.limit,
  //     pageSize: this.pageSize,
  //   });
  // }

  public moveToPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      return;
    }
    this.currentPage = pageNumber;
    const selection = this.pageSelection[pageNumber - 1];
    this.skip = selection.skip;
    this.limit = selection.limit;

    this.pagination.tablePageSize.next({
      skip: selection.skip,
      limit: selection.limit,
      pageSize: this.pageSize,
    });

    // This is the crucial new line: redraw the page numbers after moving.
    this.updateVisiblePageNumbers();
  }

  public changePageSize(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageSelection = [];
    this.limit = pageSize;
    this.skip = 0;
    this.currentPage = 1;
    this.pageIndex = 0;
    // this.getTableData();
    this.pagination.tablePageSize.next({
      skip: this.skip,
      limit: this.limit,
      pageSize: this.pageSize,
    });
  }

  // public calculateTotalPages(
  //   totalData: number,
  //   pageSize: number,
  //   tableData: Array<string>,
  //   serialNumberArray: Array<number>
  // ): void {
  //   this.tableData = tableData;
  //   this.pageNumberArray = [];
  //   this.serialNumberArray = serialNumberArray;
  //   this.totalData = totalData;
  //   this.totalPages = totalData / pageSize;
  //   if (this.totalPages % 1 != 0) {
  //     this.totalPages = Math.trunc(this.totalPages + 1);
  //   }
  //   for (let i = 1; i <= this.totalPages; i++) {
  //     const limit = pageSize * i;
  //     const skip = limit - pageSize;
  //     this.pageNumberArray.push(i);
  //     this.pageSelection.push({ skip: skip, limit: limit });
  //   }
  // }

  public calculateTotalPages(
    totalData: number,
    pageSize: number,
    tableData: Array<string>,
    serialNumberArray: Array<number>
  ): void {
    this.tableData = tableData;
    this.serialNumberArray = serialNumberArray;
    this.totalData = totalData;
    this.pageSelection = [];

    if (totalData <= 0 || pageSize <= 0) {
      this.totalPages = 0;
      this.pageNumberArray = [];
    } else {
      this.totalPages = Math.ceil(totalData / pageSize);
    }
    for (let i = 1; i <= this.totalPages; i++) {
      const limit = pageSize * i;
      const skip = limit - pageSize;
      this.pageSelection.push({ skip: skip, limit: limit });
    }

    this.updateVisiblePageNumbers();
  }

  private updateVisiblePageNumbers(): void {
    if (this.totalPages <= 7) {
      this.pageNumberArray = Array.from(
        { length: this.totalPages },
        (_, i) => i + 1
      );
      return;
    }
    const pages = new Set<number>([1, this.currentPage, this.totalPages]);
    if (this.currentPage > 2) pages.add(this.currentPage - 1);
    if (this.currentPage < this.totalPages - 1) pages.add(this.currentPage + 1);

    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const finalPages: number[] = [];
    let lastPage = 0;

    for (const page of sortedPages) {
      if (lastPage !== 0 && page - lastPage > 1) {
        finalPages.push(-1);
      }
      finalPages.push(page);
      lastPage = page;
    }
    this.pageNumberArray = finalPages;
  }
}
