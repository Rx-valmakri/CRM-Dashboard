# -*- coding: utf-8 -*-
from datetime import date, datetime, timedelta

from odoo import api, models


class CrmLead(models.Model):
    _inherit = 'crm.lead'

    @api.model
    def get_tiles_data(self):
        """ Return the tile data"""
        company_id = self.env.company
        leads = self.search([('company_id', '=', company_id.id),
                             ('user_id', '=', self.env.user.id)])
        my_leads = leads.filtered(lambda r: r.type == 'lead')
        my_opportunity = leads.filtered(lambda r: r.type == 'opportunity')
        currency = company_id.currency_id.symbol
        expected_revenue = sum(my_opportunity.mapped('expected_revenue'))
        revenue = sum(my_opportunity.mapped('sale_amount_total'))
        total_win = len(my_opportunity.filtered(lambda r: r.probability == 100))
        total_loss = len(leads.search([('active', '=', False), ('user_id', '=', self.env.user.id)]).filtered(lambda r: r.type == 'opportunity'))
        win_ratio = (total_win / (total_loss + total_win)) * 100

    # leads by medium
        leads_group_by_medium = leads.read_group(
            domain=[('user_id', '=', self.env.user.id), ('company_id', '=', company_id.id), ('type', '=', 'lead')],
            fields=[],
            groupby=['medium_id'],
        )
        for rec in leads_group_by_medium:
            medium = rec['medium_id']
            if not medium:
                rec['medium_id'] = (0, 'Null')
        mapped_data = dict([(m['medium_id'][1], m['medium_id_count']) for m in leads_group_by_medium])
        medium = list(mapped_data.keys())
        medium_count = list(mapped_data.values())

    # leads by campaign
        leads_group_by_campaign = leads.read_group(
            domain=[('user_id', '=', self.env.user.id),
                    ('company_id', '=', company_id.id), ('type', '=', 'lead')],
            fields=[],
            groupby=['campaign_id'],
        )
        for rec in leads_group_by_campaign:
            campaign = rec['campaign_id']
            if not campaign:
                rec['campaign_id'] = (0, 'Null')
        data = dict([(m['campaign_id'][1], m['campaign_id_count']) for m in
                     leads_group_by_campaign])
        campaign = list(data.keys())
        campaign_count = list(data.values())

    # Leads by Activity
        act = my_leads.filtered(lambda r: r.activity_type_id)
        activity_count = []
        act_ids = act.activity_type_id.ids
        for rec in act_ids:
            count = len(my_leads.filtered(lambda r: r.activity_type_id.id == rec))
            activity_count.append(count)
        activity = act.activity_type_id.mapped('name')

    # Leads by Month
        leads_group_by_month = leads.read_group(
            domain=[('user_id', '=', self.env.user.id),
                    ('company_id', '=', company_id.id), ('type', '=', 'lead')],
            fields=[],
            groupby=['create_date'],
        )
        monthly_data = dict(
            [(m['create_date'], m['create_date_count']) for m in
             leads_group_by_month])
        month = list(monthly_data.keys())
        monthly_count = list(monthly_data.values())

        return {
            'total_leads': len(my_leads),
            'total_opportunity': len(my_opportunity),
            'expected_revenue': expected_revenue,
            'currency': currency,
            'revenue': revenue,
            'win_ratio': win_ratio,
            'total_win': total_win,
            'total_loss': total_loss,
            'medium': medium,
            'medium_count': medium_count,
            'campaign': campaign,
            'campaign_count': campaign_count,
            'month': month,
            'monthly_count': monthly_count,
            'activity': activity,
            'activity_count': activity_count
        }

    @api.model
    def get_filtered_data(self, selected_filter):
        """ Return the filtered tile data"""
        current_date = date.today()
        company_id = self.env.company
        leads = self.search([('company_id', '=', company_id.id),
                             ('user_id', '=', self.env.user.id)])
        domain = [('user_id', '=', self.env.user.id), ('company_id', '=', company_id.id), ('type', '=', 'lead')]
        month = False
        year = False
        start_date = False
        end_date = False

        if selected_filter == "This Year":
            # current year
            year = date(current_date.year, 1, 1)
            leads = self.search([('company_id', '=', company_id.id),
                                 ('user_id', '=', self.env.user.id),
                                 ('create_date', '>=', year)])
            domain = [('user_id', '=', self.env.user.id), ('company_id', '=', company_id.id), ('type', '=', 'lead'), ('create_date', '>=', year)]

        if selected_filter == "This Quarter":
            quarterly_wise_data = self.get_quarterly_wise_data(company_id, current_date)
            leads = quarterly_wise_data[0]
            start_date = quarterly_wise_data[1]
            end_date = quarterly_wise_data[2]
            domain = [('user_id', '=', self.env.user.id), ('company_id', '=', company_id.id), ('type', '=', 'lead'), ('create_date', '>=', start_date), ('create_date', '<', end_date)]

        if selected_filter == "This Month":
            # current month
            month = date(current_date.year, current_date.month, 1)
            leads = self.search([('company_id', '=', company_id.id),
                                 ('user_id', '=', self.env.user.id),
                                 ('create_date', '>=', month)])
            domain = [('user_id', '=', self.env.user.id), ('company_id', '=', company_id.id), ('type', '=', 'lead'), ('create_date', '>=', month)]

        if selected_filter == "This Week":
            weekly_wise_data = self.get_weekly_wise_data(company_id, current_date)
            leads = weekly_wise_data[0]
            start_date = weekly_wise_data[1]
            end_date = weekly_wise_data[2]
            domain = [('user_id', '=', self.env.user.id), ('company_id', '=', company_id.id), ('type', '=', 'lead'), ('create_date', '>=', start_date), ('create_date', '<', end_date)]

        my_leads = leads.filtered(lambda r: r.type == 'lead')
        my_opportunity = leads.filtered(lambda r: r.type == 'opportunity')
        currency = company_id.currency_id.symbol
        expected_revenue = sum(my_opportunity.mapped('expected_revenue'))
        revenue = sum(my_opportunity.mapped('sale_amount_total'))
        total_win = len(my_opportunity.filtered(lambda r: r.probability == 100))
        total_loss = len(leads.search([('active', '=', False), ('user_id', '=', self.env.user.id)]).filtered(lambda r: r.type == 'opportunity'))
        if total_loss != 0:
            win_ratio = (total_win / (total_loss + total_win)) * 100
        else:
            win_ratio = 100
        if total_win == 0:
            win_ratio = 0

    # Leads by medium
        leads_group_by_medium = leads.read_group(
            domain=domain,
            fields=[],
            groupby=['medium_id'],
        )
        for rec in leads_group_by_medium:
            medium = rec['medium_id']
            if not medium:
                rec['medium_id'] = (0, 'Null')
        mapped_data = dict([(m['medium_id'][1], m['medium_id_count']) for m in
                            leads_group_by_medium])
        medium = list(mapped_data.keys())
        medium_count = list(mapped_data.values())

    # Leads by Campaign
        leads_group_by_campaign = leads.read_group(
            domain=domain,
            fields=[],
            groupby=['campaign_id'],
        )
        for rec in leads_group_by_campaign:
            campaign = rec['campaign_id']
            if not campaign:
                rec['campaign_id'] = (0, 'Null')
        data = dict([(m['campaign_id'][1], m['campaign_id_count']) for m in
                            leads_group_by_campaign])
        campaign = list(data.keys())
        campaign_count = list(data.values())

    # Leads by Month
        leads_group_by_month = leads.read_group(
            domain=domain,
            fields=[],
            groupby=['create_date'],
        )
        monthly_data = dict(
            [(m['create_date'], m['create_date_count']) for m in
             leads_group_by_month])
        months = list(monthly_data.keys())
        monthly_count = list(monthly_data.values())

    # Leads by Activity
        act = my_leads.filtered(lambda r: r.activity_type_id)
        activity_count = []
        act_ids = act.activity_type_id.ids
        for rec in act_ids:
            count = len(
                my_leads.filtered(lambda r: r.activity_type_id.id == rec))
            activity_count.append(count)
        activity = act.activity_type_id.mapped('name')

        return {
            'total_leads': len(my_leads),
            'total_opportunity': len(my_opportunity),
            'expected_revenue': expected_revenue,
            'currency': currency,
            'revenue': revenue,
            'win_ratio': win_ratio,
            'total_win': total_win,
            'total_loss': total_loss,
            'year': year,
            'month': month,
            'start_date': start_date,
            'end_date': end_date,
            'medium': medium,
            'medium_count': medium_count,
            'campaign': campaign,
            'campaign_count': campaign_count,
            'months': months,
            'monthly_count': monthly_count,
            'activity': activity,
            'activity_count': activity_count
        }

    def get_quarterly_wise_data(self, company_id, current_date):
        """ Return quarterly wise leads, start_date, end_date """
        month_int = int(current_date.strftime('%m'))
        match month_int:
            case 1 | 2 | 3:
                start_date = date(current_date.year, 1, 1)
                end_date = date(current_date.year, 4, 1)
                leads = self.search([('company_id', '=', company_id.id),
                                     ('user_id', '=', self.env.user.id),
                                     ('create_date', '>=', start_date),
                                     ('create_date', '<', end_date)])

            case 4 | 5 | 6:
                start_date = date(current_date.year, 4, 1)
                end_date = date(current_date.year, 7, 1)
                leads = self.search([('company_id', '=', company_id.id),
                                     ('user_id', '=', self.env.user.id),
                                     ('create_date', '>=', start_date),
                                     ('create_date', '<', end_date)])

            case 7 | 8 | 9:
                start_date = date(current_date.year, 7, 1)
                end_date = date(current_date.year, 9, 1)
                leads = self.search([('company_id', '=', company_id.id),
                                     ('user_id', '=', self.env.user.id),
                                     ('create_date', '>=', start_date),
                                     ('create_date', '<', end_date)])

            case _:
                start_date = date(current_date.year, 9, 1)
                end_date = date(current_date.year, 12, 31)
                leads = self.search([('company_id', '=', company_id.id),
                                     ('user_id', '=', self.env.user.id),
                                     ('create_date', '>=', start_date),
                                     ('create_date', '<=', end_date)])

        return leads, start_date, end_date

    def get_weekly_wise_data(self, company_id, current_date):
        """ Return weekly wise leads, start_date, end_date """
        start = current_date - timedelta(days=current_date.weekday())
        end = start + timedelta(days=6)
        leads = self.search([('company_id', '=', company_id.id),
                             ('user_id', '=', self.env.user.id),
                             ('create_date', '>=', start),
                             ('create_date', '<', end)])

        return leads, start, end
