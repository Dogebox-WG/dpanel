export function buildTimezoneFields(inFlight, timezones, label = 'Timezone') {
  return {
    sections: [
      {
        name: 'timezone',
        fields: [
          {
            name: 'timezone',
            type: 'select',
            label,
            required: true,
            help: 'Where in the world should your clock be set to',
            disabled: inFlight,
            searchable: true,
            hoist: true,
            maxOptionsVisible: 8,
            options: timezones.map((timezone) => ({
              value: timezone.id,
              label: timezone.displayLabel,
              searchText: `${timezone.id} ${timezone.label ?? ''}`,
            })),
          },
        ],
      },
    ],
  };
}
