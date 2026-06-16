import { Component } from '@angular/core';
import { IDoesFilterPassParams, IFilterParams } from 'ag-grid-community';

@Component({
  selector: 'app-excel-filter',
  standalone: false,
  templateUrl: './excel-style-filter.component.html',
  styleUrl: './excel-style-filter.component.scss',
})

export class ExcelStyleFilterComponent {
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
  public isFilterApplied: boolean = false;
  private dataRefreshListener!: (event: Event) => void;
  private isCurrentlyApplying = false;
  private availableValuesAfterOtherFilters: Set<string> = new Set();
  private isFilterCleared: boolean = false;
  private pendingFilterClear: boolean = false;
  private static filterApplicationOrder: string[] = [];

  ngOnInit() {
    this.filterResetListener = this.handleFilterReset.bind(this);
    window.addEventListener('filterReset', this.filterResetListener);
    this.dataRefreshListener = this.handleDataRefresh.bind(this);
    window.addEventListener('dataRefresh', this.dataRefreshListener);
  }

  afterGuiAttached(): void {
    this.refreshFilterValues();
  }

  agInit(params: IFilterParams): void {
    this.params = params;
    this.fieldName = this.params.colDef.field!;
    ExcelStyleFilterComponent.activeFilterColumns.add(this.fieldName);
    this.isFilterApplied = false;
    this.isFilterCleared = false;
    this.pendingFilterClear = false;
    this.refreshFilterValues();
    this.filterChangedListener = () => {
      if (
        this.params?.api &&
        !this.isCurrentlyApplying &&
        !this.pendingFilterClear
      ) {
        this.syncWithGridState();
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

  private isPrimaryFilter(): boolean {
    if (!this.params?.api) return false;
    const filterModel = this.params.api.getFilterModel();
    const activeFilters = Object.keys(filterModel);
    if (activeFilters.length === 0) return true;
    if (!activeFilters.includes(this.fieldName)) return false;
    const firstActiveFilter =
      ExcelStyleFilterComponent.filterApplicationOrder.find((columnName) =>
        activeFilters.includes(columnName)
      );
    return firstActiveFilter === this.fieldName;
  }

  private syncWithGridState(): void {
  if (!this.params?.api) return;
  const currentFilterModel = this.params.api.getFilterModel();
  const thisColumnFilter = currentFilterModel[this.fieldName];
  if (!thisColumnFilter && this.isFilterApplied) {
    this.resetToUnfilteredState();
    return;
  }
  if (thisColumnFilter && thisColumnFilter.values) {
    const gridValues = new Set(thisColumnFilter.values);
    const ourValues = new Set(Array.from(this.selected));
    if (
      gridValues.size !== ourValues.size ||
      ![...gridValues].every((v: any) => ourValues.has(v))
    ) {
      this.syncFromGridModel(thisColumnFilter);
      return;
    }
  }
  if (!this.isFilterApplied && !this.isPrimaryFilter()) {
    setTimeout(() => {
      if (
        !this.isCurrentlyApplying &&
        !this.isFilterApplied &&
        !this.pendingFilterClear
      ) {
        this.refreshFilterValues();
      }
    }, 50);
  }
  else if (!this.isFilterApplied && this.isPrimaryFilter()) {
    if (!this.isCurrentlyApplying && !this.pendingFilterClear) {
      setTimeout(() => {
        if (
          !this.isCurrentlyApplying &&
          !this.isFilterApplied &&
          !this.pendingFilterClear
        ) {
          this.refreshFilterValues();
        }
      }, 50);
    }
  }
}

  private resetToUnfilteredState(): void {
    this.isFilterApplied = false;
    this.appliedFilterValues.clear();
    this.isFilterCleared = true;
    this.refreshFilterValues();
  }

  private syncFromGridModel(filterModel: any): void {
    if (filterModel.values) {
      this.selected = new Set(filterModel.values);
      this.appliedFilterValues = new Set(filterModel.values);
      this.originalSelection = new Set(this.selected);
      this.isFilterApplied = true;
      this.updateDisplayState();
    }
  }


  private getValuesAvailableAfterOtherFilters(): Set<string> {
    if (!this.params?.api) return new Set();
    const availableValues = new Set<string>();
    try {
      const filterModel = this.params.api.getFilterModel();
      const otherFilters = Object.keys(filterModel).filter(
        (key) => key !== this.fieldName
      );
      if (this.isPrimaryFilter() || otherFilters.length === 0) {
        this.getAllUniqueColumnValues().forEach((val) =>
          availableValues.add(val)
        );
        return availableValues;
      }
      this.params.api.forEachNode((node) => {
        if (node.data) {
          let passesOtherFilters = true;
          for (const filterColumn of otherFilters) {
            const columnFilter = filterModel[filterColumn];
            if (columnFilter && columnFilter.values) {
              const rowValue = this.formatGridValue(node.data[filterColumn]);
              if (!columnFilter.values.includes(rowValue)) {
                passesOtherFilters = false;
                break;
              }
            }
          }
          if (passesOtherFilters) {
            let rawValue = node.data[this.fieldName];
            let displayValue = this.formatGridValue(rawValue);
            availableValues.add(displayValue);
          }
        }
      });
    } catch (error) {
      console.error(
        'Error getting available values after other filters:',
        error
      );
      this.getAllUniqueColumnValues().forEach((val) =>
        availableValues.add(val)
      );
    }
    return availableValues;
  }

  private getAllUniqueColumnValues(): string[] {
    if (!this.params?.api) return [];
    const seen = new Set<string>();
    const values: string[] = [];
    try {
      this.params.api.forEachNode((node) => {
        if (node.data) {
          let rawValue = node.data[this.fieldName];
          if (
            rawValue === null ||
            rawValue === undefined ||
            rawValue === '' ||
            (typeof rawValue === 'string' && rawValue.trim() === '')
          ) {
            console.log(`Found blank value in ${this.fieldName}:`, rawValue);
          }
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
    const sortedValues = this.sortValues(values);
    return sortedValues;
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
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      value === ' ' ||
      (typeof value === 'string' && value.trim() === '') ||
      (typeof value === 'string' && value === '\u00A0') ||
      (typeof value === 'number' && isNaN(value))
    ) {
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
    const stringValue = String(value);
    if (stringValue.trim() === '') {
      return '__BLANK__';
    }
    return stringValue.replace(/ /g, '\u00A0');
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

  private sortValuesWithCheckedOnTop(values: string[]): string[] {
    const checked: string[] = [];
    const uncheckedEnabled: string[] = [];
    const disabled: string[] = [];
    values.forEach((val) => {
      if (this.selected.has(val)) {
        checked.push(val);
      } else if (this.isValueDisabled(val)) {
        disabled.push(val);
      } else {
        uncheckedEnabled.push(val);
      }
    });
    const sortGroup = (group: string[]) => {
      const blanks: string[] = [];
      const numbers: string[] = [];
      const texts: string[] = [];
      group.forEach((val) => {
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
    };
    return [
      ...sortGroup(checked),
      ...sortGroup(uncheckedEnabled),
      ...sortGroup(disabled),
    ];
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
    if (this.isCurrentlyApplying && !this.isFilterCleared) {
      return;
    }
    const allValues = this.getAllUniqueColumnValues();
    this.availableValuesAfterOtherFilters =
    this.getValuesAvailableAfterOtherFilters();
    this.values = allValues; 
    if (
      this.isFilterCleared ||
      (!this.isFilterApplied && !this.isCurrentlyApplying)
    ) {
      if (this.isPrimaryFilter()) {
        this.selected = new Set(this.values);
      } else {
        this.selected = new Set(this.availableValuesAfterOtherFilters);
      }
      this.originalSelection = new Set(this.selected);
      this.isFilterCleared = false;
    } else if (this.isFilterApplied) {
      const validAppliedValues = new Set<string>();
      this.appliedFilterValues.forEach((val) => {
        if (this.values.includes(val)) {
          validAppliedValues.add(val);
        }
      });
      this.selected = validAppliedValues;
    }

    this.updateDisplayState();
  }

  private updateDisplayState(): void {
    this.filteredOptions = this.sortValuesWithCheckedOnTop([...this.values]);
    if (this.searchText) {
      this.onSearchChange();
    }
    this.updateSelectAll();
    this.emitMapperStatus();
  }

  isValueDisabled(value: string): boolean {
    if (this.isPrimaryFilter()) {
      return false;
    }
    if (!this.params?.api) return false;
    const filterModel = this.params.api.getFilterModel();
    const otherFilters = Object.keys(filterModel).filter(
      (key) => key !== this.fieldName
    );
    if (otherFilters.length === 0) {
      return false;
    }
    return !this.availableValuesAfterOtherFilters.has(value);
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
  const filtered = this.values.filter((val) =>
    this.formatDisplayValue(val).toLowerCase().includes(search)
  );
  if (this.isFilterApplied) {
    this.filteredOptions = this.sortValuesWithCheckedOnTop(filtered);
  } else {
    this.filteredOptions = this.sortValues(filtered);
  }
  this.updateSelectAllForVisibleOptions();
}

private updateSelectAllForVisibleOptions(): void {
  const availableVisibleOptions = this.filteredOptions.filter(v => !this.isValueDisabled(v));
  const selectedVisibleCount = availableVisibleOptions.filter((v) => this.selected.has(v)).length;
  if (selectedVisibleCount === 0) {
    this.selectAll = false;
    this.indeterminate = false;
  } else if (selectedVisibleCount === availableVisibleOptions.length) {
    this.selectAll = true;
    this.indeterminate = false;
  } else {
    this.selectAll = false;
    this.indeterminate = true;
  }
}


  onToggle(value: string): void {
    if (this.isValueDisabled(value)) {
      return;
    }
    if (this.selected.has(value)) {
      this.selected.delete(value);
    } else {
      this.selected.add(value);
    }
    this.updateSelectAllForVisibleOptions();
    this.emitMapperStatus();
  }
 
  onSelectAllChange(): void {
  const availableVisibleOptions = this.filteredOptions.filter(v => !this.isValueDisabled(v));
  const allVisibleSelected = availableVisibleOptions.every((v) => this.selected.has(v));
  if (allVisibleSelected) {
    availableVisibleOptions.forEach((v) => this.selected.delete(v));
  } else {  
    availableVisibleOptions.forEach((v) => this.selected.add(v));
  }
  this.updateSelectAllForVisibleOptions();
  this.emitMapperStatus();
}


  updateSelectAll(): void {
    const availableFilteredOptions = this.filteredOptions.filter(
      (v) => !this.isValueDisabled(v)
    );
    const selectedAvailableCount = availableFilteredOptions.filter((v) =>
      this.selected.has(v)
    ).length;
    if (selectedAvailableCount === 0) {
      this.selectAll = false;
      this.indeterminate = false;
    } else if (selectedAvailableCount === availableFilteredOptions.length) {
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
    this.pendingFilterClear = true;
    this.isCurrentlyApplying = true;
    const index = ExcelStyleFilterComponent.filterApplicationOrder.indexOf(
      this.fieldName
    );
    if (index > -1) {
      ExcelStyleFilterComponent.filterApplicationOrder.splice(index, 1);
    }
    const currentFilterModel = this.params.api.getFilterModel();
    if (currentFilterModel[this.fieldName]) {
      delete currentFilterModel[this.fieldName];
      this.params.api.setFilterModel(currentFilterModel);
    }
    this.appliedFilterValues.clear();
    this.isFilterApplied = false;
    this.isFilterCleared = true;
    this.refreshFilterValues();
    this.searchText = '';
    this.updateDisplayState();
    this.params.api.hidePopupMenu();
    setTimeout(() => {
      this.pendingFilterClear = false;
      this.isCurrentlyApplying = false;
    }, 100);
  }

  applyFilter(): void {
    this.isCurrentlyApplying = true;
    if (
      !ExcelStyleFilterComponent.filterApplicationOrder.includes(this.fieldName)
    ) {
      ExcelStyleFilterComponent.filterApplicationOrder.push(this.fieldName);
    }
    this.appliedFilterValues = new Set(this.selected);
    const wasSearching = this.searchText.length > 0;
  if (wasSearching) {
    this.searchText = '';
    if (this.isFilterApplied) {
      this.filteredOptions = this.sortValuesWithCheckedOnTop([...this.values]);
    } else {
      this.filteredOptions = this.sortValues([...this.values]);
    }
  }
    let totalAvailableValues;
    if (this.isPrimaryFilter()) {
      totalAvailableValues = this.getAllUniqueColumnValues().length;
    } else {
      totalAvailableValues = this.availableValuesAfterOtherFilters.size;
    }
    this.isFilterApplied =
      this.selected.size < totalAvailableValues && this.selected.size > 0;
    this.originalSelection = new Set(this.selected);
    this.emitMapperStatus();
    setTimeout(() => {
      if (this.params?.filterChangedCallback) {
        try {
          this.params.filterChangedCallback();
        } catch (error) {
          console.error('Error in filterChangedCallback:', error);
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
  if (this.isFilterApplied) {
    this.filteredOptions = this.sortValuesWithCheckedOnTop([...this.values]);
  } else {
    this.filteredOptions = this.sortValues([...this.values]);
  }
  this.updateSelectAll();
  this.emitMapperStatus();
  if (this.params?.api) {
    this.params.api.hidePopupMenu();
  }
  }


  isFilterActive(): boolean {
    return this.isFilterApplied && this.appliedFilterValues.size > 0;
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    if (!params.data) return false;
    let rawValue = params.data[this.fieldName];
    let formattedValue = this.formatGridValue(rawValue);
    if (this.isFilterApplied && this.appliedFilterValues.size > 0) {
      return this.appliedFilterValues.has(formattedValue);
    }
    return true;
  }


  getModel() {
    if (!this.isFilterApplied || this.appliedFilterValues.size === 0) {
      return null; 
    }
    return {
      values: Array.from(this.appliedFilterValues),
      fieldName: this.fieldName,
    };
  }

  setModel(model: any): void {
    if (
      model?.values &&
      Array.isArray(model.values) &&
      model.values.length > 0
    ) {
      this.selected = new Set(model.values);
      this.appliedFilterValues = new Set(model.values);
      this.originalSelection = new Set(this.selected);
      this.isFilterApplied = true;
      if (
        !ExcelStyleFilterComponent.filterApplicationOrder.includes(
          this.fieldName
        )
      ) {
        ExcelStyleFilterComponent.filterApplicationOrder.push(this.fieldName);
      }
      this.updateSelectAll();
      this.emitMapperStatus();
      if (this.params?.filterChangedCallback) {
        this.params.filterChangedCallback();
      }
    } else {
      this.resetToUnfilteredState();
    }
  }

  private handleFilterReset = (event: Event): void => {
    const customEvent = event as CustomEvent;
    if (this.fieldName === customEvent.detail?.columnField) {
      this.resetFilter();
    }
  };

  // resetFilter(): void {
  //   this.selected = new Set(this.values);
  //   this.originalSelection = new Set(this.values);
  //   this.searchText = '';
  //   this.filteredOptions = [...this.values];
  //   this.updateSelectAll();
  //   if (this.params?.filterChangedCallback) {
  //     this.params.filterChangedCallback();
  //   }
  // }

  resetFilter(): void {
    this.isFilterCleared = true;
    this.isFilterApplied = false;
    this.appliedFilterValues.clear();
    this.refreshFilterValues();
    this.searchText = '';
    this.updateDisplayState();

    if (this.params?.filterChangedCallback) {
      this.params.filterChangedCallback();
    }
  }

  getColumnDisplayName(): string {
    return (
      this.params?.colDef?.headerName || this.params?.colDef?.field || 'Column'
    );
  }

  // clearAllFilters(): void {
  //   if (this.params?.context?.componentParent?.clearAllFilters) {
  //     this.params.context.componentParent.clearAllFilters();
  //   }
  //   if (this.params?.api) {
  //     this.params.api.hidePopupMenu();
  //   }
  // }

  clearAllFilters(): void {
    if (this.params?.context?.componentParent?.clearAllFilters) {
      this.pendingFilterClear = true;
      ExcelStyleFilterComponent.filterApplicationOrder = [];
      this.params.context.componentParent.clearAllFilters();
      setTimeout(() => {
        this.resetToUnfilteredState();
        this.pendingFilterClear = false;
      }, 100);
    }
    if (this.params?.api) {
      this.params.api.hidePopupMenu();
    }
  }

  private handleDataRefresh = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const eventDetail = customEvent.detail;
    if (eventDetail) {
      const { action, columnField, affectedRows, oldValue, newValue } =
        eventDetail;
      const isPrimaryColumnEdit =
        columnField === this.fieldName && this.isFilterApplied;

      if (isPrimaryColumnEdit) {
        setTimeout(() => {
          this.handlePrimaryColumnEdit(eventDetail);
        }, 10);
      } else if (
        columnField === this.fieldName ||
        action === 'delete' ||
        action === 'deleteMultiple'
      ) {
        setTimeout(() => {
          this.forceRefreshValues();
        }, 10);
      } else if (action === 'bulkEdit') {
        setTimeout(() => {
          this.forceRefreshValues();
        }, 10);
      }
    }
  };

  private handlePrimaryColumnEdit(eventDetail: any): void {
    if (this.isCurrentlyApplying) {
      return;
    }
    const { action, newValue, oldValue } = eventDetail;
    const allCurrentValues = this.getAllUniqueColumnValues();
    const updatedSelections = new Set<string>();
    this.appliedFilterValues.forEach((val) => {
      if (allCurrentValues.includes(val)) {
        updatedSelections.add(val);
      }
    });

    if (newValue !== undefined && newValue !== null) {
      const formattedNewValue = this.formatGridValue(newValue);
      if (allCurrentValues.includes(formattedNewValue)) {
        updatedSelections.add(formattedNewValue);
      }
    }

    if (action === 'bulkEdit') {
      const previousValues = [...this.values];
      const newValuesFromEdit = allCurrentValues.filter(
        (val) => !previousValues.includes(val)
      );
      newValuesFromEdit.forEach((val) => updatedSelections.add(val));
    }
    this.values = allCurrentValues;
    this.selected = updatedSelections;
    this.appliedFilterValues = new Set(updatedSelections);
    this.filteredOptions = [...this.values];
    if (this.searchText) {
      this.onSearchChange();
    }
    this.updateSelectAll();
    this.emitMapperStatus();
    if (this.params?.filterChangedCallback) {
      this.params.filterChangedCallback();
    }
  }

  private forceRefreshValues(): void {
    if (this.isCurrentlyApplying) {
      return;
    }
    const newValues = this.getAllUniqueColumnValues();
    const previousValues = [...this.values];
    this.values = newValues;
    if (!this.isFilterApplied) {
      this.selected = new Set(this.values);
      this.originalSelection = new Set(this.selected);
    } else {
      const preservedSelections = new Set<string>();
      this.appliedFilterValues.forEach((val) => {
        if (this.values.includes(val)) {
          preservedSelections.add(val);
        }
      });
      const newValuesAdded = this.values.filter(
        (val) => !previousValues.includes(val)
      );
      if (newValuesAdded.length > 0) {
        const wasSelectingAll =
          this.appliedFilterValues.size === previousValues.length;

        if (wasSelectingAll) {
          newValuesAdded.forEach((val) => preservedSelections.add(val));
          this.appliedFilterValues = new Set(preservedSelections);
        }
      }
      this.selected = preservedSelections;
    }
    this.filteredOptions = [...this.values];
    if (this.searchText) {
      this.onSearchChange();
    }
    this.updateSelectAll();
    this.emitMapperStatus();
  }

  ngOnDestroy(): void {
    ExcelStyleFilterComponent.activeFilterColumns.delete(this.fieldName);
    const index = ExcelStyleFilterComponent.filterApplicationOrder.indexOf(
      this.fieldName
    );
    if (index > -1) {
      ExcelStyleFilterComponent.filterApplicationOrder.splice(index, 1);
    }
    if (this.filterResetListener) {
      window.removeEventListener('filterReset', this.filterResetListener);
    }
    if (this.dataRefreshListener) {
      window.removeEventListener('dataRefresh', this.dataRefreshListener);
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