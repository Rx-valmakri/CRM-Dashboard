/**@odoo-module **/
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component } from  "@odoo/owl";
import { session } from "@web/session";

const actionRegistry = registry.category("actions");

class CrmDashboard extends Component {
    setup() {
         super.setup()
         this.orm = useService('orm')
         this.action = useService("action");
         this._fetch_data()
   }
   _fetch_data(){
   var self = this;
   console.log("fetching")
  this.orm.call("crm.lead", "get_tiles_data", [], {}).then(function(result){
           $('#my_lead').append('<span>' + result.total_leads + '</span>');
           $('#my_opportunity').append('<span>' + result.total_opportunity + '</span>');
           $('#ex_revenue').append('<span>' + result.currency + result.expected_revenue + '</span>');
           $('#rev').append('<span>' + result.currency + result.revenue + '</span>');
           $('#win_ratio').append('<span>' + result.win_ratio + "%" + '</span>');
           $('#total_win').append('<span>'+ " WIN : " + result.total_win + '</span>');
           $('#total_loss').append('<span>'+ " LOSS : " + result.total_loss + '</span>');
           });
           self.dashboard_filter = false
       };

   onSelectionChanged(){
      var selected_filter = document.querySelector('#filter').value;
      var self = this;
      this.orm.call("crm.lead", "get_filtered_data", [], {selected_filter}).then(function(result){
         $('#my_lead').html('<span>' + result.total_leads + '</span>');
           $('#my_opportunity').html('<span>' + result.total_opportunity + '</span>');
           $('#ex_revenue').html('<span>' + result.currency + result.expected_revenue + '</span>');
           $('#rev').html('<span>' + result.currency + result.revenue + '</span>');
           $('#win_ratio').html('<span>' + result.win_ratio + "%" + '</span>');
           $('#total_win').html('<span>'+ " WIN : " + result.total_win + '</span>');
           $('#total_loss').html('<span>'+ " LOSS : " + result.total_loss + '</span>');
           if(result.year) self.dashboard_filter = result.year;
           if(result.month) self.dashboard_filter = result.month;
           self.start_date = result.start_date;
           self.end_date = result.end_date;
           });
      };

   onClick_leads(){
       if (this.dashboard_filter == false)
       {
         var domain = [['user_id', '=', session.user_id], ['type', '=', 'lead']]
       }
       if (this.dashboard_filter)
       {
         var domain = [['user_id', '=', session.user_id], ['type', '=', 'lead'], ['create_date', '>=', this.dashboard_filter]]
       }
       if (this.start_date)
       {
          var domain = [['user_id', '=', session.user_id], ['type', '=', 'lead'], ['create_date', '>=', this.start_date], ['create_date', '<', this.end_date]]
       }

       this.action.doAction({
                type: "ir.actions.act_window",
                name: "Leads",
                res_model: "crm.lead",
                views: [[false, 'tree']],
                target: 'current',
                view_mode : 'tree',
                domain: domain,
        });
   };

   onClick_opportunity(){
      if (this.dashboard_filter == false)
       {
         var domain = [['user_id', '=', session.user_id], ['type', '=', 'opportunity']]
       }
       if (this.dashboard_filter)
       {
         var domain = [['user_id', '=', session.user_id], ['type', '=', 'opportunity'], ['create_date', '>=', this.dashboard_filter]]
       }
       if (this.start_date)
       {
          var domain = [['user_id', '=', session.user_id], ['type', '=', 'opportunity'], ['create_date', '>=', this.start_date], ['create_date', '<', this.end_date]]
       }
      this.action.doAction({
                type: "ir.actions.act_window",
                name: "Leads",
                res_model: "crm.lead",
                views: [[false, 'tree']],
                target: 'current',
                view_mode : 'tree',
                domain: domain,
        });
   };
}
CrmDashboard.template = "crm_dashboard.CrmDashboard";
actionRegistry.add("action_crm_dashboard", CrmDashboard);