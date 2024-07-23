# -*- coding: utf-8 -*-
{
    'name': "CRM Dashboard",
    'version': '17.0.1.0.0',
    'summary': 'CRM Dashboard',
    'description': 'CRM Dashboard',
    'license': 'LGPL-3',
    'application': True,
    'depends': ['crm', 'sale'],

    'data': [
        'views/crm_team_view.xml',
        'views/menu_views.xml',
    ],

    'assets': {
        'web.assets_backend': [
            'crm_dashboard/static/src/js/lib/Chart.bundle.js',
            'crm_dashboard/static/src/xml/crm_dashboard.xml',
            'crm_dashboard/static/src/js/crm_dashboard.js',
        ],
    },
}