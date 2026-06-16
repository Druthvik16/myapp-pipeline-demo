import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovedPreviewComponent } from './approved-preview.component';

describe('ApprovedPreviewComponent', () => {
  let component: ApprovedPreviewComponent;
  let fixture: ComponentFixture<ApprovedPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApprovedPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovedPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
