import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDetailSignalComponent } from './modal-detail-signal.component';

describe('ModalDetailSignalComponent', () => {
  let component: ModalDetailSignalComponent;
  let fixture: ComponentFixture<ModalDetailSignalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDetailSignalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDetailSignalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
