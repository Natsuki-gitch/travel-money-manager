USERS = [
  { name: "natsuki", email: "natsuki", password: "natsuki" },
  { name: "shimada", email: "shimada", password: "shimada" },
  { name: "shimada2", email: "shimada2", password: "shimada2" },
  { name: "shimada3", email: "shimada3", password: "shimada3" },
  { name: "shimada4", email: "shimada4", password: "shimada4" },
].freeze

USERS.each do |attrs|
  User.find_or_create_by!(email: attrs[:email]) do |user|
    user.name = attrs[:name]
    user.password = attrs[:password]
  end
end

puts "Seeded #{User.count} users"
