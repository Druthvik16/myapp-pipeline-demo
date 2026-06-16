import { Component } from '@angular/core';
import { IDoesFilterPassParams, IFilterParams } from 'ag-grid-community';

@Component({
  selector: 'app-excel-filter',
  standalone: false,
  templateUrl: './excel-filter.component.html',
  styleUrl: './excel-filter.component.scss',
})

export class ExcelFilterComponent {
  params!: IFilterParams;
  values: string[] = [];
  filteredOptions: string[] = [];
  selected: Set<string> = new Set();
  originalSelection: Set<string> = new Set();
  searchText: string = '';
  selectAll: boolean = true;
  indeterminate: boolean = false;
  fieldName: string = '';
  public anyGlobalFilterActive: boolean = false;
  private globalFilterChangedListener!: () => void;
  private filterChangedListener!: () => void;
  private filterResetListener!: (event: Event) => void;
  private static activeFilterColumns = new Set<string>();
  private appliedFilterValues: Set<string> = new Set();
  private isFilterApplied: boolean = false;
  private dataRefreshListener!: (event: Event) => void;
  private isCurrentlyApplying = false;

  ngOnInit() {
    this.filterResetListener = this.handleFilterReset.bind(this);
    window.addEventListener('filterReset', this.filterResetListener);
    this.dataRefreshListener = this.handleDataRefresh.bind(this);
    window.addEventListener('filterRefresh', this.dataRefreshListener);
  }

  agInit(params: IFilterParams): void {
    this.params = params;
    this.fieldName = this.params.colDef.field!;
    ExcelFilterComponent.activeFilterColumns.add(this.fieldName);
    this.refreshFilterValues();
    this.filterChangedListener = () => {
      if (this.params?.api && !this.isCurrentlyApplying) {
        if (!this.isFilterApplied) {
          setTimeout(() => {
            if (!this.isCurrentlyApplying && !this.isFilterApplied) {
              this.refreshFilterValues();
            }
          }, 50);
        }
      }
    };

    this.globalFilterChangedListener = () => {
      if (this.params?.api) {
        this.anyGlobalFilterActive = this.params.api.isAnyFilterPresent();
      }
    };
    if (this.params?.api) {
      this.params.api.addEventListener(
        'filterChanged',
        this.filterChangedListener
      );
      this.params.api.addEventListener(
        'filterChanged',
        this.globalFilterChangedListener
      );
      this.anyGlobalFilterActive = this.params.api.isAnyFilterPresent();
    }
    this.emitMapperStatus();
  }

  private getUniqueColumnValues(): string[] {
    if (!this.params?.api) return [];
    const seen = new Set<string>();
    const values: string[] = [];
    try {
      this.params.api.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) {
          let rawValue = node.data[this.fieldName];

          let displayValue = this.formatGridValue(rawValue);

          if (!seen.has(displayValue)) {
            seen.add(displayValue);
            values.push(displayValue);
          }
        }
      });
    } catch (error) {
      return [];
    }
    return this.sortValues(values);
  }

  private formatGridValue(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '__BLANK__';
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    return String(value).replace(/ /g, '\u00A0');
  }

  private sortValues(values: string[]): string[] {
    const blanks: string[] = [];
    const numbers: string[] = [];
    const texts: string[] = [];
    values.forEach((val) => {
      if (val === '__BLANK__') {
        blanks.push(val);
      } else if (this.isNumericValue(val)) {
        numbers.push(val);
      } else {
        texts.push(val);
      }
    });
    numbers.sort((a, b) => {
      const numA = this.parseNumericValue(a);
      const numB = this.parseNumericValue(b);
      return numA - numB;
    });
    texts.sort((a, b) => a.localeCompare(b));
    return [...numbers, ...texts, ...blanks];
  }

  private isNumericValue(value: string): boolean {
    if (value === '__BLANK__') return false;
    const cleanValue = value.replace(/[^\d.-]/g, '');
    const hasLetters = /[a-zA-Z]/.test(value);
    const hasSpecialChars = /[^\d\s.-]/.test(value);
    if (hasLetters || hasSpecialChars) return false;
    return !isNaN(Number(cleanValue)) && cleanValue.length > 0;
  }

  private parseNumericValue(value: string): number {
    const cleanValue = value.replace(/[^\d.-]/g, '');
    return Number(cleanValue) || 0;
  }

  refreshFilterValues(): void {
    if (this.isCurrentlyApplying) {
      return;
    }
    const newAvailableValues = this.getUniqueColumnValues();
    const valuesChanged =
      newAvailableValues.length !== this.values.length ||
      !newAvailableValues.every((val) => this.values.includes(val));
    if (!valuesChanged && this.values.length > 0) {
      return;
    }
    this.values = newAvailableValues;
    if (!this.isFilterApplied) {
      this.selected = new Set(this.values);
      this.originalSelection = new Set(this.selected);
    } else {
      const validAppliedValues = new Set<string>();
      this.appliedFilterValues.forEach((val) => {
        if (this.values.includes(val)) {
          validAppliedValues.add(val);
        }
      });
      this.selected = validAppliedValues;
    }
    this.filteredOptions = [...this.values];
    if (this.searchText) {
      this.onSearchChange();
    }
    this.updateSelectAll();
    this.emitMapperStatus();
  }

  formatDisplayValue(value: string): string {
    if (value === '__BLANK__') return '(Blanks)';
    return value;
  }

  getSelectedFilteredOptions(): string[] {
    return this.filteredOptions.filter((option) => this.selected.has(option));
  }

  getUnselectedFilteredOptions(): string[] {
    return this.filteredOptions.filter((option) => !this.selected.has(option));
  }

  onSearchChange(): void {
    const search = this.searchText.toLowerCase();
    this.filteredOptions = this.values.filter((val) =>
      this.formatDisplayValue(val).toLowerCase().includes(search)
    );
    this.updateSelectAll();
  }

  onToggle(value: string): void {
    if (this.selected.has(value)) {
      this.selected.delete(value);
    } else {
      this.selected.add(value);
    }
    this.updateSelectAll();
    this.emitMapperStatus();
  }

  onSelectAllChange(): void {
    const allVisibleSelected = this.filteredOptions.every((v) =>
      this.selected.has(v)
    );
    if (allVisibleSelected) {
      this.filteredOptions.forEach((v) => this.selected.delete(v));
    } else {
      this.filteredOptions.forEach((v) => this.selected.add(v));
    }
    this.updateSelectAll();
    this.emitMapperStatus();
  }

  updateSelectAll(): void {
    const filteredSelectedCount = this.filteredOptions.filter((v) =>
      this.selected.has(v)
    ).length;
    if (filteredSelectedCount === 0) {
      this.selectAll = false;
      this.indeterminate = false;
    } else if (filteredSelectedCount === this.filteredOptions.length) {
      this.selectAll = true;
      this.indeterminate = false;
    } else {
      this.selectAll = false;
      this.indeterminate = true;
    }
  }

  emitMapperStatus(): void {
    const selectedValues = Array.from(this.selected);
    if (this.params?.context?.componentParent?.onMapperFilterChanged) {
      this.params.context.componentParent.onMapperFilterChanged(
        this.fieldName,
        selectedValues
      );
    }
  }

  clearFilterAlternative(): void {
    if (!this.params?.api || !this.params.colDef?.field) return;
    this.appliedFilterValues.clear();
    this.isFilterApplied = false;
    this.isCurrentlyApplying = true;
    this.selected = new Set(this.values);
    this.originalSelection = new Set(this.selected);
    this.searchText = '';
    this.filteredOptions = [...this.values];
    this.updateSelectAll();
    this.emitMapperStatus();
    if (this.params?.filterChangedCallback) {
      this.params.filterChangedCallback();
    }
    this.params.api.hidePopupMenu();
    setTimeout(() => {
      this.isCurrentlyApplying = false;
    }, 50);
  }

  applyFilter(): void {
    this.appliedFilterValues = new Set(this.selected);
    this.isFilterApplied = this.selected.size < this.values.length;
    this.originalSelection = new Set(this.selected);
    this.isCurrentlyApplying = true;
    this.emitMapperStatus();
    setTimeout(() => {
      if (this.params?.filterChangedCallback) {
        try {
          this.params.filterChangedCallback();
        } catch (error) {
          console.warn('Filter callback error:', error);
        }
      }
      setTimeout(() => {
        if (this.params?.api) {
          this.params.api.hidePopupMenu();
        }
        setTimeout(() => {
          this.isCurrentlyApplying = false;
        }, 100);
      }, 50);
    }, 10);
  }

  cancelFilter(): void {
    this.selected = new Set(this.originalSelection);
    this.searchText = '';
    this.filteredOptions = [...this.values];
    this.updateSelectAll();
    this.emitMapperStatus();
    if (this.params?.api) {
      this.params.api.hidePopupMenu();
    }
  }

  isFilterActive(): boolean {
    return this.selected.size < this.values.length && this.values.length > 0;
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    if (!params.data) return false;
    let rawValue = params.data[this.fieldName];
    let formattedValue = this.formatGridValue(rawValue);

    return this.selected.has(formattedValue);
  }

  getModel() {
    return {
      values: Array.from(this.selected),
      fieldName: this.fieldName,
    };
  }

  setModel(model: any): void {
    if (model?.values) {
      this.selected = new Set(model.values);
      this.originalSelection = new Set(this.selected);
      this.updateSelectAll();
      if (this.params?.filterChangedCallback) {
        this.params.filterChangedCallback();
      }
    }
  }

  private handleFilterReset = (event: Event): void => {
    const customEvent = event as CustomEvent;
    if (this.fieldName === customEvent.detail?.columnField) {
      this.resetFilter();
    }
  };

  resetFilter(): void {
    this.selected = new Set(this.values);
    this.originalSelection = new Set(this.values);
    this.searchText = '';
    this.filteredOptions = [...this.values];
    this.updateSelectAll();
    if (this.params?.filterChangedCallback) {
      this.params.filterChangedCallback();
    }
  }

  getColumnDisplayName(): string {
    return (
      this.params?.colDef?.headerName || this.params?.colDef?.field || 'Column'
    );
  }

  clearAllFilters(): void {
    if (this.params?.context?.componentParent?.clearAllFilters) {
      this.params.context.componentParent.clearAllFilters();
    }
    if (this.params?.api) {
      this.params.api.hidePopupMenu();
    }
  }

  private handleDataRefresh = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const updatedColumn = customEvent.detail?.columnField;
    if (this.fieldName === updatedColumn) {
      this.forceRefreshValues();
    }
  };

  private forceRefreshValues(): void {
    const newValues = this.getUniqueColumnValues();
    this.values = newValues;
    this.filteredOptions = [...this.values];
    if (!this.isFilterApplied) {
      this.selected = new Set(this.values);
      this.originalSelection = new Set(this.selected);
    } else {
      const validSelections = new Set<string>();
      this.selected.forEach((val) => {
        if (this.values.includes(val)) {
          validSelections.add(val);
        }
      });
      const newValuesAdded = this.values.filter(
        (val) => !this.selected.has(val)
      );
      if (newValuesAdded.length > 0) {
        if (
          this.originalSelection.size ===
          this.values.length - newValuesAdded.length
        ) {
          newValuesAdded.forEach((val) => validSelections.add(val));
        }
      }
      this.selected = validSelections;
    }
    if (this.searchText) {
      this.onSearchChange();
    }
    this.updateSelectAll();
    console.log('[Excel Filter] Values refreshed, new values:', this.values);
  }

  ngOnDestroy(): void {
    ExcelFilterComponent.activeFilterColumns.delete(this.fieldName);
    if (this.filterResetListener) {
      window.removeEventListener('filterReset', this.filterResetListener);
    }
    if (this.dataRefreshListener) {
      window.removeEventListener('filterRefresh', this.dataRefreshListener);
    }
    if (this.params?.api && this.filterChangedListener) {
      this.params.api.removeEventListener(
        'filterChanged',
        this.filterChangedListener
      );
    }
    if (this.params?.api && this.globalFilterChangedListener) {
      this.params.api.removeEventListener(
        'filterChanged',
        this.globalFilterChangedListener
      );
    }
  }
}
