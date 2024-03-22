export const grouped_verti = {
  type: 'grouped',
  ui: 'vertical',
  sets: [
    { 
      name: 'identity',
      label: "Identity",
      fields: [
        {
          "type": "text",
          "name": "nodeName",
          "label": "Node Name",
          "placeholder": "Enter your node's name",
          "help": "A memorable name for your Dogecoin Node",
          "required": true,
          "value": "MyDogecoinNode"
        },
        {
          "type": "textarea",
          "name": "nodeDescription",
          "label": "Node Description",
          "placeholder": "Describe your node's purpose",
          "rows": 4,
          "value": "This node is dedicated to maintaining a stable, secure, and efficient Dogecoin network."
        }
      ],
    },
    { 
      name: 'connection',
      label: "Connectivity",
      fields: [
        {
          "type": "number",
          "name": "maxConnections",
          "label": "Max Connections",
          "help": "Maximum number of peer connections",
          "min": 1,
          "max": 150,
          "required": true,
          "value": 75
        },
        {
          "type": "toggle",
          "name": "enableCrawling",
          "label": "Enable Crawling",
          "checked": true,
          "value": true
        },
        {
          "type": "range",
          "name": "crawlingIntensity",
          "label": "Crawling Intensity",
          "min": 1,
          "max": 100,
          "value": 80,
          "showTooltip": true
        },
      ],
    },
    {
      name: 'advance',
      label: 'Advanced',
      fields: [
        {
          "type": "radio",
          "name": "dataSync",
          "label": "Data Synchronization Mode",
          "value": "pruned",
          "required": true,
          "options": [
            { "value": "full", "label": "Full" },
            { "value": "pruned", "label": "Pruned" }
          ],
        },
        {
          "type": "date",
          "name": "maintenanceWindow",
          "label": "Maintenance Window",
          "placeholder": "Select a date",
          "value": "2023-04-01"
        },
        
        {
          "type": "checkbox",
          "name": "enalbeBackups",
          "label": "Enable automatic backup",
          "required": true,
          "checked": true,
          "value": true
        },
        {
          "type": "radioButton",
          "name": "backupFrequency",
          "label": "Backup Frequency",
          "options": [
            { "value": "daily", "label": "Daily" },
            { "value": "weekly", "label": "Weekly" },
            { "value": "monthly", "label": "Monthly" }
          ],
          "required": true,
          "value": "weekly"
        }
      ]
    }
  ]
};