import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectedPreviewComponent } from './rejected-preview.component';

describe('RejectedPreviewComponent', () => {
  let component: RejectedPreviewComponent;
  let fixture: ComponentFixture<RejectedPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RejectedPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RejectedPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
