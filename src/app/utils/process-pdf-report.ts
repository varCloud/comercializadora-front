import { NgBlockUI } from "ng-block-ui";
import * as FileSaver from 'file-saver';
import * as printJS from 'print-js';
import { Router } from "@angular/router";
import { NotifierService } from "angular-notifier";
import { CONSTANTS } from "../config/constants";


export const proccessReportPdf =
(
    _notifierService: NotifierService,
    blockUI: NgBlockUI, 
    file:any, 
    fileName: string, 
    action: number,
    ) =>
{

    const byteArray = new Uint8Array(
        atob(file)
            .split('')
            .map((char) => char.charCodeAt(0))
    );
    const blob = new Blob([byteArray], {
        type: 'application/pdf',
    });
    const url = window.URL.createObjectURL(blob);
    if (action === CONSTANTS.FILE_DOCUMENT_ACTIONS.DOWNLOAD) {
        FileSaver.saveAs(url, `${fileName}-evaluacion.pdf`);
    } else {
        const agent = window.navigator.userAgent.toLowerCase()
        if (agent.indexOf('firefox') > -1) {
            window.open(url);
            blockUI.stop();

        } else {
            printJS({
                printable: file,
                type: 'pdf',
                base64: true,
                onError: (error) => {
                    _notifierService.notify('error','Error al imprimir el documento')
                    blockUI.stop();
                },
                onPrintDialogClose: () => {
                    blockUI.stop();
                }
            });
        }
    }
    blockUI.stop();
}
