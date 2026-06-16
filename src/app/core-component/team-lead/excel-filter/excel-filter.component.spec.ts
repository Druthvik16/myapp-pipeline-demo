import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelFilterComponent } from './excel-filter.component';

describe('ExcelFilterComponent', () => {
  let component: ExcelFilterComponent;
  let fixture: ComponentFixture<ExcelFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExcelFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
