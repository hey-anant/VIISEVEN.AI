import { defineSchema, defineTable } from "convex/server";
import {v} from "convex/values"
export default defineSchema({
    users:defineTable({
        name:v.string(),
        email:v.string(),
        picture:v.string(),
        uid:v.string(),
        token:v.optional(v.number())
    })
    .index("by_uid", ["uid"])
    .index("by_email", ["email"]),

    workspace:defineTable({
        messages:v.any(),//JSON object
        fileData:v.optional(v.any()),   //JSON object
        user:v.id('users'), //uid
    })
})