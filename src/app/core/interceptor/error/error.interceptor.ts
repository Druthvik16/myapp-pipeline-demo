import { HttpEvent, HttpHandler, HttpInterceptor, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private router: Router) { }
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        console.log("document.url : ", document.URL, this.router.url)
        return next.handle(request).pipe(catchError(err => {
        console.log("request.url : ", request.url)
        if(err.status === 401){
            this.router.navigateByUrl('/auth/signin')
        }
        if (err.error instanceof Blob) {
          return throwError(() => err);
        }

         const error = err?.error?.message || err?.error?.error || err?.error?.err || err?.error?.e || err?.statusText || err?.error || err
                return throwError(error);
        }))
    }
}