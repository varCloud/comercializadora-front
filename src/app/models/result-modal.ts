export interface ResultModal {

    status: ENUM_ESTATUS_MODAL
    message: string
    data: any
  }

  export class ResultModalModel implements ResultModal{
    status: ENUM_ESTATUS_MODAL = ENUM_ESTATUS_MODAL.NONE
    message: string = ''
    data: any = {}
    constructor(data:any) {
      if (data) {
        this.status = data.status ??  this.status
        this.message = data.message ?? data.message ?? this.message
        this.data = data.data ?? data.Modelo ?? this.data
      }
    }
  }

  export enum ENUM_ESTATUS_MODAL{
    NONE=0,
    OK= 1,
    CANCEL=2,
    ERROR=3,
    NEXT=4,
    BACK = 5,
  }
