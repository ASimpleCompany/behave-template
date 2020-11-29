var userRoles = {
    descripcion: '',
    funcionalidades: [],
    modulos:[],
    nav:[],
    sidebars: [{
      recursohumano:[],
      planilla: [],
      administracion: [],
     },
    ],
    paths: [ 
      {  ref: 'modulos' ,descripcion: 'recurso humano' , path: '/employee' , icon: 'fa fa-home'},
      {  ref: 'modulos' ,descripcion: 'planilla' , path: '/payroll' , icon: 'fa fa-book'},
      {  ref: 'modulos',  descripcion: 'administracion' , path: '/admin' , icon: 'mdi mdi-clipboard-account'},
      {  ref: 'recurso humano' , descripcion: 'colaboradores' , path: '/employee/table' , icon: 'fa fa-address-book menu-icon' },
      {  ref: 'recurso humano',  descripcion: 'horarios' , path: '/employee/schedule/table' , icon: 'fa fa-clock-o menu-icon' },
      {  ref: 'recurso humano',   descripcion: 'departamentos', path: '/employee/department/table', icon:'fa fa-th-large menu-icon'},
      {  ref: 'planilla',  descripcion: 'planillas', path: '/planilla'},
      {  ref: 'planilla', descripcion: 'reportes', path: '/reportes'},
      {  ref: 'planilla',  descripcion: 'descuentos', path: '/descuentos'},
      {  ref: 'planilla', descripcion: 'marcaciones', path: '/employee/schedule/table'},
      {  ref: 'administracion' , descripcion: 'configuraciones', path: '/configuraciones' , icon: 'mdi mdi-account-multiple menu-icon'},
      {  ref: 'administracion' ,descripcion: 'usuarios', path: '/admin/table' , icon: 'mdi mdi-account-multiple menu-icon' },
      {  ref: 'administracion' ,   descripcion: 'actividades usuarios', path: '/admin/activities' , icon: 'fa fa-eye menu-icon'}
     
      
    ]
  }

module.exports = userRoles
  