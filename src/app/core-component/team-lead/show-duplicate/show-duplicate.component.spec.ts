import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowDuplicateComponent } from './show-duplicate.component';

describe('ShowDuplicateComponent', () => {
  let component: ShowDuplicateComponent;
  let fixture: ComponentFixture<ShowDuplicateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowDuplicateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowDuplicateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
