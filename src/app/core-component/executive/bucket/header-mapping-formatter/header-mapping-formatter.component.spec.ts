import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderMappingFormatterComponent } from './header-mapping-formatter.component';

describe('HeaderMappingFormatterComponent', () => {
  let component: HeaderMappingFormatterComponent;
  let fixture: ComponentFixture<HeaderMappingFormatterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeaderMappingFormatterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderMappingFormatterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
