const DEFAULT_CALENDAR_COLOR = '#2563EB';

export async function up(pgm) {
  pgm.addColumn('calendars', {
    color: {
      type: 'text',
      notNull: true,
      default: DEFAULT_CALENDAR_COLOR,
    },
  });
  pgm.addConstraint('calendars', 'calendars_color_format', {
    check: "color ~ '^#[0-9A-Fa-f]{6}$'",
  });
}

export async function down(pgm) {
  pgm.dropConstraint('calendars', 'calendars_color_format');
  pgm.dropColumn('calendars', 'color');
}
