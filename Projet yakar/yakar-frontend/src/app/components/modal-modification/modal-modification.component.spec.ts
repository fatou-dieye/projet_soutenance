import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalModificationComponent } from './modal-modification.component';

describe('ModalModificationComponent', () => {
  let component: ModalModificationComponent;
  let fixture: ComponentFixture<ModalModificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalModificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalModificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
