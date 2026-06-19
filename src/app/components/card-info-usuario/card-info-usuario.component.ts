import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { MaterialModule } from 'src/app/material.module';
import { UserModel } from 'src/app/models/user';
import { UserCustomModel } from 'src/app/models/user-custom.model';
import { ClavesService } from 'src/app/services/claves.service';

@Component({
    selector: 'app-card-info-usuario',
    imports: [BlockUIModule, MaterialModule, CommonModule],
    templateUrl: './card-info-usuario.component.html',
    styleUrl: './card-info-usuario.component.scss'
})
export class CardInfoUsuarioComponent implements OnInit {
  @BlockUI('shipping-ticket-layout') blockUILayout: NgBlockUI;

  @Input() NumUsuario: number;
  @Input() UserCustom: UserCustomModel;
  @Input() User: UserModel;
  user: UserModel = new UserModel({})
  constructor(
    private _clavesService: ClavesService
  ) { }

  ngOnInit(): void {
    if(this.NumUsuario){
      this.getDatosUsuario(this.NumUsuario);
    }
    else if(this.User){
      this.user = this.User
    }
  }

  getDatosUsuario(numUsuario: number) {
    this.blockUILayout.start();
    this._clavesService.getUsuario(numUsuario).subscribe({
      next: (user) => {
        this.user = user
        this.blockUILayout.stop();
      },
      error: (err) => {
        this.blockUILayout.stop();
      }
    })
  }
}
