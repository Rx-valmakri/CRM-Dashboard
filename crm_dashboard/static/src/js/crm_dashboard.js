/**@odoo-module **/
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, } from  "@odoo/owl";
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
        console.log("fetch this ",self)
        this.orm.call("crm.lead", "get_tiles_data", [], {}).then(function(result){
           $('#my_lead').append('<span>' + result.total_leads + '</span>');
           $('#my_opportunity').append('<span>' + result.total_opportunity + '</span>');
           $('#ex_revenue').append('<span>' + result.currency + result.expected_revenue + '</span>');
           $('#rev').append('<span>' + result.currency + result.revenue + '</span>');
           $('#win_ratio').append('<span>' + result.win_ratio + "%" + '</span>');
           $('#total_win').append('<span>'+ " WIN : " + result.total_win + '</span>');
           $('#total_loss').append('<span>'+ " LOSS : " + result.total_loss + '</span>');

           var ctx = document.querySelector('#crm_graph').getContext("2d");
           var doug_ctx = document.querySelector('#crm_doug').getContext("2d");
           var doug_ctx_camp = document.querySelector('#crm_doug_camp').getContext("2d");
           var pie_ctx = document.querySelector('#crm_pie_chart').getContext("2d");
           var yValues = [result.total_leads, result.total_opportunity];
           self.render_lead_opp_chart(ctx, yValues);
           self.render_doughnut_chart(doug_ctx, result.medium, result.medium_count);
           self.render_doughnut_chart_camp(doug_ctx_camp, result.campaign, result.campaign_count);
           self.render_monthly_table(result.month, result.monthly_count);
           self.render_activity_pie_chart(pie_ctx, result.activity, result.activity_count);
           });
           self.dashboard_filter = false
   };

    onSelectionChanged(){
      var selected_filter = document.querySelector('#filter').value;
      var self = this;
      if (this.chart) {
              this.chart.destroy();
      }
      if (this.dough_chart){
         this.dough_chart.destroy();
      }
      if (this.dough_chart_camp){
          this.dough_chart_camp.destroy();
      }
      if (this.pie_chart){
         this.pie_chart.destroy();
      }
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

           var ctx = document.querySelector('#crm_graph').getContext("2d");
           var doug_ctx = document.querySelector('#crm_doug').getContext("2d");
           var doug_ctx_camp = document.querySelector('#crm_doug_camp').getContext("2d");
           var pie_ctx = document.querySelector('#crm_pie_chart').getContext("2d");
           var yValues = [result.total_leads, result.total_opportunity];
           self.render_lead_opp_chart(ctx, yValues);
           self.render_doughnut_chart(doug_ctx, result.medium, result.medium_count);
           self.render_doughnut_chart_camp(doug_ctx_camp, result.campaign, result.campaign_count);
           self.render_monthly_table(result.months, result.monthly_count);
           self.render_activity_pie_chart(pie_ctx, result.activity, result.activity_count);
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

// Leads/Opportunity Bar chart
 render_lead_opp_chart(ctx, yValues) {
     var xValues = ["Lead", "Opportunity"];
     var barColors = ["orange", "blue"];
     var chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: xValues,
            datasets: [{
                label: 'Lead/Opportunity Bar Chart',
                backgroundColor: barColors,
                data: yValues
            }]
      },
      options: {
        responsive: true,
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
      }
     });
     this.chart = chart
 };

// Leads by medium
render_doughnut_chart(doug_ctx, medium, medium_count){
   const colors = Array.from(
          { length: medium.length },
          () =>
          '#' + Math.floor(Math.random() * 16777215).toString(16)
        );
   var doughnut_chart = new Chart(doug_ctx, {
    type: "doughnut",
    data: {
        labels: medium,
        datasets: [{
            backgroundColor: colors,
            data: medium_count
        }]
    },
    options: {
    }
});
this.dough_chart = doughnut_chart
};

// Leads by Campaign
render_doughnut_chart_camp(doug_ctx_camp, campaign, campaign_count){
   const colors = Array.from(
          { length: campaign.length },
          () =>
          '#' + Math.floor(Math.random() * 16777215).toString(16)
        );
   var doughnut_chart_camp = new Chart(doug_ctx_camp, {
    type: "doughnut",
    data: {
        labels: campaign,
        datasets: [{
            backgroundColor: colors,
            data: campaign_count
        }]
    },
    options: {
    }
});
this.dough_chart_camp = doughnut_chart_camp
};

//monthly table
render_monthly_table(month, monthly_count){
  $('#month_head').html("<th></th>")
  $('#months_head').html("<th></th>")
  $('#monthly_count').html("<th></th>")
  $('#month_head').append("<th style='height: 10px;' colspan="+month.length+"><b><center>Month</center></b></th>");
  for (var i=0; i<month.length; i++)
  {
    $('#months_head').append("<th style='height: 20px;'><center><b>"+month[i]+"</center></b></th>");
    $('#monthly_count').append("<th style='height: 20px;'><center><b>"+monthly_count[i]+"</center></b></th>");
  }
};

render_activity_pie_chart(pie_ctx, activity, activity_count){
   const colors = Array.from(
          { length: activity.length },
          () =>
          '#' + Math.floor(Math.random() * 16777215).toString(16)
        );
   var pie_chart = new Chart(pie_ctx, {
    type: "pie",
    data: {
        labels: activity,
        datasets: [{
            backgroundColor: colors,
            data: activity_count
        }]
    },
    options: {}
});
this.pie_chart = pie_chart
};
}
CrmDashboard.template = "crm_dashboard.CrmDashboard";
actionRegistry.add("action_crm_dashboard", CrmDashboard);