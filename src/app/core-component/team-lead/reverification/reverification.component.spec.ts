import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReverificationComponent } from './reverification.component';

describe('ReverificationComponent', () => {
  let component: ReverificationComponent;
  let fixture: ComponentFixture<ReverificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReverificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReverificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
