import { defineField, defineType } from 'sanity'

export const workoutType = defineType({
  name: 'workout',
  title: 'Workout',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'geoJson',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'workout',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'route',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'activityType',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
})
