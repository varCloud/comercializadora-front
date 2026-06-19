import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardInfoUsuarioComponent } from './card-info-usuario.component';

describe('CardInfoUsuarioComponent', () => {
  let component: CardInfoUsuarioComponent;
  let fixture: ComponentFixture<CardInfoUsuarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardInfoUsuarioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardInfoUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
