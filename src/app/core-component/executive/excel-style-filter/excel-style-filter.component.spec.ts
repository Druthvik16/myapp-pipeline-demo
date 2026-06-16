import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelStyleFilterComponent } from './excel-style-filter.component';

describe('ExcelStyleFilterComponent', () => {
  let component: ExcelStyleFilterComponent;
  let fixture: ComponentFixture<ExcelStyleFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExcelStyleFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelStyleFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
