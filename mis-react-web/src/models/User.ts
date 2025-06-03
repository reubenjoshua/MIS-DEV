export type UserToken = {
    token:      string;
    user:       string;
}

export type UserLogin = {
    username: string;
    password: string;
}

export type UserRegistrationModel = {
    FirstName:  string;
    LastName:   string;
    Email:      string;
    Password:   string;

    Username:   string;
    Role:       number;
    Area:       number;
    Branch:     number;
}

export type UserProfile = {
    ID:         number;
    FirstName:  string;
    LastName:   string;
    Email:      string;
    Username:   string;
    Password:   string;
    Role:       number;
}

export type SingleUserType = {
    ID:         number;
    FirstName:  string;
    LastName:   string;
    Username:   string;
    Email:      string;
    Password:   string;
    Role:       string;
}

export type RoleType = {
    ID:         number;
    roleName:   string;
}

export type AreaType = {
    ID:         number;
    areaCode:   number;
    areaName:   string;
}

export type BranchType = {
    ID:         number;
    branchName: string;
}

export type DashboardType = {
    ActiveUsers?:   number;
    Areas?:         number;
    Branches?:      number;
    Pending?:       number;
    Approved?:      number;
    Declined?:      number;
    Encoded?:       number;
    Rejected?:      number;
}