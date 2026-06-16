import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanningProcessComponent } from './scanning-process.component';

describe('ScanningProcessComponent', () => {
  let component: ScanningProcessComponent;
  let fixture: ComponentFixture<ScanningProcessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScanningProcessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanningProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
